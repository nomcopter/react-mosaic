// It should still run the tests if there are TypeScript complaints, those problems will be handled by the build step.
return require("ts-node").register({
  disableWarnings: true,
});
