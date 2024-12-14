export type JSONPrimitive = string | number | boolean | null;
export type JSONObject = { [k: string]: JSONValue };
export type JSONArray = JSONValue[];
export type JSONValue = JSONArray | JSONObject | JSONPrimitive;
