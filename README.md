# Git URL evidence for OpenChamber #7088

Current fix commit: deca9646588b94109ed494750fe68391804c7365.

The original Git-panel screenshots show valid trailing-slash URLs failing before normalization and completing Sync after normalization.

The diagnostic screenshots use a rejected URL with fixture credentials. Before the extension, the row names Git LFS at path dot. After it, the row names the offending submodule at extras/third_party/libjxl. Fixed-message redaction still removes the credentials, and a fresh saved-operation read retains the module path.
