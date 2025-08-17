import React from "react";
import { FEATURE_SEARCH_V2 } from "../lib/featureFlags";
import SearchHubV2 from "../components/search-v2/SearchHub.v2";
import "../styles/search-v2.css";

export default function SearchHubV2Page() {
  if (!FEATURE_SEARCH_V2) return <div>Search V2 disabled</div>;
  return <SearchHubV2 />;
}
