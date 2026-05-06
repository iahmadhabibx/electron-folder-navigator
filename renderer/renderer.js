const filesStatus = document.getElementById("files-status");
const previewStatus = document.getElementById("preview-status");
const currentFolder = document.getElementById("current-folder");
const previewContent = document.getElementById("preview-content");
const loadMoreButton = document.getElementById("load-more-button");
const filesTableBody = document.getElementById("files-table-body");
const pickFolderButton = document.getElementById("pick-folder-button");

const state = {
  files: [],
  previewOffset: 0,
  previewFileSize: 0,
  selectedFile: null,
  currentDirectory: null,
  isLoadingPreview: false,
};

const PREVIEW_CHUNK_SIZE = 256 * 1024;

const formatBytes = (size) => {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const setFilesStatus = (message) => {
  filesStatus.textContent = message;
};

const setPreviewStatus = (message) => {
  previewStatus.textContent = message;
};

const resetPreviewUi = () => {
  state.previewOffset = 0;
  state.previewFileSize = 0;
  loadMoreButton.disabled = true;
  previewContent.textContent = "";
};

const createFileRow = (file) => {
  const row = document.createElement("tr");
  const nameCell = document.createElement("td");
  nameCell.textContent = file.name;

  const sizeCell = document.createElement("td");
  sizeCell.textContent = formatBytes(file.size);
  const typeCell = document.createElement("td");
  typeCell.textContent = file.type;
  row.append(nameCell, sizeCell, typeCell);

  row.addEventListener("click", () => {
    for (const tr of filesTableBody.querySelectorAll("tr")) {
      tr.classList.remove("is-selected");
    }
    row.classList.add("is-selected");
    state.selectedFile = file;
    readPreviewChunk(true).catch(handlePreviewError);
  });

  return row;
};

const renderFiles = (files) => {
  filesTableBody.innerHTML = "";

  for (const file of files) {
    console.log("file check:: ", file);

    filesTableBody.appendChild(createFileRow(file));
  }
};

const readPreviewChunk = async (clear = false) => {
  if (!state.selectedFile || state.isLoadingPreview) {
    return;
  }

  state.isLoadingPreview = true;
  loadMoreButton.disabled = true;

  if (clear) resetPreviewUi();

  setPreviewStatus(`Loading preview from ${state.selectedFile.name}...`);

  const payload = {
    filePath: state.selectedFile.absolutePath,
    offset: state.previewOffset,
    chunkSize: PREVIEW_CHUNK_SIZE,
  };

  try {
    const chunk = await window.fileExplorerApi.readTextChunk(payload);
    previewContent.textContent += chunk.content;
    state.previewOffset += chunk.bytesRead;
    state.previewFileSize = chunk.fileSize;

    if (chunk.hasMore) {
      setPreviewStatus(
        `Showing ${formatBytes(state.previewOffset)} of ${formatBytes(state.previewFileSize)}.`,
      );
      loadMoreButton.disabled = false;
    } else {
      setPreviewStatus(
        `Preview complete (${formatBytes(state.previewFileSize)}).`,
      );
    }
  } finally {
    state.isLoadingPreview = false;
  }
};

const formatErrorLine = (error) => {
  const message = error?.message || "Unexpected error.";
  const code = error?.code ? `(${error.code})` : "";
  return `Error ${code} ${message}`.trim();
};

const handlePreviewError = (error) => {
  setPreviewStatus(formatErrorLine(error));
  state.isLoadingPreview = false;
  loadMoreButton.disabled = true;
};

pickFolderButton.addEventListener("click", async () => {
  try {
    const selectedDirectory = await window.fileExplorerApi.pickDirectory();

    if (!selectedDirectory) {
      setFilesStatus("Folder selection canceled.");
      return;
    }

    state.currentDirectory = selectedDirectory;
    currentFolder.textContent = selectedDirectory;
    setFilesStatus("Reading files...");
    resetPreviewUi();
    setPreviewStatus("Select a text file to preview.");

    const files = await window.fileExplorerApi.listFiles(selectedDirectory);
    state.files = files;
    state.selectedFile = null;

    renderFiles(files);

    if (!files.length) setFilesStatus("No files found in this folder.");
    else setFilesStatus(`Found ${files.length} files.`);
  } catch (error) {
    setFilesStatus(formatErrorLine(error));
  }
});

loadMoreButton.addEventListener("click", async () => {
  try {
    await readPreviewChunk(false);
  } catch (error) {
    console.error(error);
    handlePreviewError(error);
  }
});
