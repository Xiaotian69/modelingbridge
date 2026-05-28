import bikeDemandDemo from "../../../cases/bike_demand_demo.json";
import cityLivabilityDemo from "../../../cases/city_livability_demo.json";
import creditDecisionDemo from "../../../cases/credit_decision_demo.json";
import evaluationTopsisDemo from "../../../cases/evaluation_topsis_demo.json";
import optimizationDispatchDemo from "../../../cases/optimization_dispatch_demo.json";
import trafficPolicePlatformDemo from "../../../cases/traffic_police_platform_demo.json";
import wineEvaluationDemo from "../../../cases/wine_evaluation_demo.json";
import wordlePredictionDemo from "../../../cases/wordle_prediction_demo.json";
import type { CaseDetail } from "../types";

const localCases = [
  bikeDemandDemo,
  cityLivabilityDemo,
  creditDecisionDemo,
  evaluationTopsisDemo,
  optimizationDispatchDemo,
  trafficPolicePlatformDemo,
  wineEvaluationDemo,
  wordlePredictionDemo,
] as CaseDetail[];

export function getLocalCase(slug: string): CaseDetail | null {
  return localCases.find((item) => item.slug === slug) ?? null;
}
