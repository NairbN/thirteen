import { defineRailway, github, project, service } from "railway/iac";

export default defineRailway(() => {
  const backend = service("backend", {
    source: github("NairbN/thirteen", { checkSuites: false, rootDirectory: "backend" }),
    build: {
      builder: "DOCKERFILE",
      dockerfilePath: "Dockerfile",
    },
    replicas: { sfo: 1 },
  });

  return project("thirteen", {
    resources: [backend],
  });
});
