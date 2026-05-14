import { renderMilestoneChart } from "./openproject/milestone.js"; 
import { renderNetwork } from "./openproject/network.js";

const DATA_URL_MILESTONE = "https://raw.githubusercontent.com/Chris010980/openproject-analytics/main/output/metrics.json"; 
const DATA_URL_NETWORK = "https://raw.githubusercontent.com/Chris010980/openproject-analytics/main/output/parsed.json";

let milestoneData = [];
let networkData = [];
let riskExposureMap = {};

let state = {
  minRisk: 0,
  minPriority: 0
};

const priorityMap = {
  "Low": 1,
  "Intermediate": 2,
  "High": 3,
  "Very High": 4
};

function filterMilestones(data) {
  return data.filter(d => {
    const priority = typeof d.priority === 'number' ? d.priority : (priorityMap[d.priority] || 0);
    return d.risk_exposure >= state.minRisk && priority >= state.minPriority;
  });
}

function filterNetwork(data) {
  const allowedMilestones = new Set(
    data.milestones
      .filter(m => {
        const priority = typeof m.priority === 'number' ? m.priority : (priorityMap[m.priority] || 0);
        const risk = riskExposureMap[m.id] || 0;
        return priority >= state.minPriority && risk >= state.minRisk;
      })
      .map(m => m.id)
  );

  return {
    milestones: data.milestones.filter(m => allowedMilestones.has(m.id)),
    risks: data.risks,
  };
}

function update() {
  const filteredMilestones = filterMilestones(milestoneData);
  const filteredNetwork = filterNetwork(networkData);

  // vorher löschen (wichtig!)
  d3.select("#milestone-chart").selectAll("*").remove();
  d3.select("#network").selectAll("*").remove();

  renderMilestoneChart(filteredMilestones);
  renderNetwork(filteredNetwork);
}

async function init() {
  try {
    const response_milestone = await fetch(DATA_URL_MILESTONE);
    milestoneData = await response_milestone.json();
    
    // Map erstellen: id -> risk_exposure
    riskExposureMap = Object.fromEntries(
      milestoneData.map(m => [m.id, m.risk_exposure])
    );

    const response_network = await fetch(DATA_URL_NETWORK);
    networkData = await response_network.json();

    // UI Events
    const riskFilter = document.getElementById("riskFilter");
    const priorityFilter = document.getElementById("priorityFilter");
    const riskValue = document.getElementById("riskValue");

    if (riskFilter) {
      riskFilter.addEventListener("input", (e) => {
        state.minRisk = +e.target.value;
        if (riskValue) riskValue.textContent = state.minRisk;
        update();
      });
    }

    if (priorityFilter) {
      priorityFilter.addEventListener("change", (e) => {
        state.minPriority = +e.target.value;
        update();
      });
    }

    update();

  } catch (err) {
    console.error("Error loading data:", err);
  }
}

init();