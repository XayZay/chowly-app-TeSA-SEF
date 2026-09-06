import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextVitals,
  {
    rules: {
      "@next/next/no-img-element": "off",
      "react-hooks/set-state-in-effect": "off"
    }
  },
  {
    ignores: [".next/**", "node_modules/**"]
  }
];

export default eslintConfig;
