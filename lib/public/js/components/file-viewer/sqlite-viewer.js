import { h } from "preact";
import htm from "htm";
import { LoadingSpinner } from "../loading-spinner.js";

const html = htm.bind(h);

export const SqliteViewer = ({
  sqliteSummary,
  sqliteSelectedTable,
  setSqliteSelectedTable,
  sqliteTableOffset,
  setSqliteTableOffset,
  sqliteTableLoading,
  sqliteTableError,
  sqliteTableData,
  kSqlitePageSize,
}) => {
  const sqliteRows = Array.isArray(sqliteTableData?.rows) ? sqliteTableData.rows : [];
  const sqliteColumns =
    Array.isArray(sqliteTableData?.columns) && sqliteTableData.columns.length
      ? sqliteTableData.columns
      : (sqliteSummary?.objects || []).find(
          (entry) => entry?.name === sqliteSelectedTable,
        )?.columns || [];
  const sqliteTotalRows = Number(sqliteTableData?.totalRows || 0);
  const sqliteCanGoPrev = sqliteTableOffset > 0;
  const sqliteCanGoNext = sqliteTableOffset + kSqlitePageSize < sqliteTotalRows;

  return html`
    <div class="file-viewer-sqlite-shell">
      ${sqliteSummary?.objects?.length
        ? html`
            <div class="file-viewer-sqlite-layout">
              <div class="file-viewer-sqlite-list">
                ${sqliteSummary.objects.map(
                  (entry) => html`
                    <button
                      type="button"
                      class=${`file-viewer-sqlite-card ${sqliteSelectedTable === entry.name ? "is-active" : ""}`}
                      onclick=${() => {
                        if (!entry?.name || sqliteSelectedTable === entry.name) return;
                        setSqliteSelectedTable(entry.name);
                        setSqliteTableOffset(0);
                      }}
                    >
                      <div class="file-viewer-sqlite-title">
                        <span>${entry.name}</span>
                        <span class="file-viewer-sqlite-type">${entry.type}</span>
                      </div>
                    </button>
                  `,
                )}
              </div>
              <div class="file-viewer-sqlite-table-shell">
                ${sqliteSelectedTable
                  ? html`
                      <div class="file-viewer-sqlite-table-header">
                        <span class="file-viewer-sqlite-table-name">
                          ${sqliteSelectedTable}
                        </span>
                        <div class="file-viewer-sqlite-table-nav">
                          <button
                            type="button"
                            class="ac-btn-secondary text-xs px-2 py-1 rounded-md"
                            disabled=${!sqliteCanGoPrev}
                            onclick=${() =>
                              setSqliteTableOffset((previousOffset) =>
                                Math.max(0, previousOffset - kSqlitePageSize),
                              )}
                          >
                            Prev
                          </button>
                          <button
                            type="button"
                            class="ac-btn-secondary text-xs px-2 py-1 rounded-md"
                            disabled=${!sqliteCanGoNext}
                            onclick=${() =>
                              setSqliteTableOffset(
                                (previousOffset) => previousOffset + kSqlitePageSize,
                              )}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                      <div class="file-viewer-sqlite-table-meta">
                        ${sqliteTotalRows
                          ? `${Math.min(sqliteTableOffset + 1, sqliteTotalRows)}-${Math.min(sqliteTableOffset + kSqlitePageSize, sqliteTotalRows)} of ${sqliteTotalRows} rows`
                          : "No rows"}
                      </div>
                      ${sqliteTableLoading
                        ? html`
                            <div class="file-viewer-loading-shell">
                              <${LoadingSpinner} className="h-4 w-4" />
                            </div>
                          `
                        : sqliteTableError
                          ? html`
                              <div class="file-viewer-state file-viewer-state-error">
                                ${sqliteTableError}
                              </div>
                            `
                          : html`
                              <div class="file-viewer-sqlite-table-wrap">
                                <table class="file-viewer-sqlite-table">
                                  <thead>
                                    <tr>
                                      ${sqliteColumns.map(
                                        (column) => html`<th>${column.name}</th>`,
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    ${sqliteRows.length
                                      ? sqliteRows.map(
                                          (row, rowIndex) => html`
                                            <tr key=${rowIndex}>
                                              ${sqliteColumns.map((column) => {
                                                const cellValue = row?.[column.name];
                                                const displayValue =
                                                  cellValue === null
                                                    ? "NULL"
                                                    : typeof cellValue === "object"
                                                      ? JSON.stringify(cellValue)
                                                      : String(cellValue ?? "");
                                                return html`
                                                  <td title=${displayValue}>
                                                    ${displayValue}
                                                  </td>
                                                `;
                                              })}
                                            </tr>
                                          `,
                                        )
                                      : html`
                                          <tr>
                                            <td colspan=${Math.max(1, sqliteColumns.length)}>
                                              <span class="file-viewer-sqlite-table-empty">
                                                No rows
                                              </span>
                                            </td>
                                          </tr>
                                        `}
                                  </tbody>
                                </table>
                              </div>
                            `}
                    `
                  : html`
                      <div class="file-viewer-state">Select a table to view rows.</div>
                    `}
              </div>
            </div>
            <div class="file-viewer-sqlite-footer">
              ${sqliteSummary.truncated
                ? `Showing ${sqliteSummary.objects.length} of ${sqliteSummary.totalObjects} tables/views`
                : `${sqliteSummary.totalObjects} tables/views`}
            </div>
          `
        : html`
            <div class="file-viewer-state">
              SQLite database loaded, but no tables/views were found.
            </div>
          `}
    </div>
  `;
};
