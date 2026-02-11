/**
 * Entry point - redirects to main app
 */

import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/home" />;
}
