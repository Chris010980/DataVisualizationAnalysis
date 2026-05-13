import { renderMilestoneChart } from "./openproject-analytics.js";
import { renderNetwork } from "./network.js";

const DATA_URL_MILESTONE = "https://raw.githubusercontent.com/Chris010980/openproject-analytics/main/output/metrics.json";
const DATA_URL_NETWORK = "https://raw.githubusercontent.com/Chris010980/openproject-analytics/main/output/parsed.json";


async function init() {
  try {
    const response_milestone = await fetch(DATA_URL_MILESTONE);
    const data_milestone = await response_milestone.json();

    const response_network = await fetch(DATA_URL_NETWORK);
    const data_network = await response_network.json();

    renderMilestoneChart(data_milestone);
    renderNetwork(data_network);

  } catch (err) {
    console.error("Error loading data:", err);
  }
}

init();