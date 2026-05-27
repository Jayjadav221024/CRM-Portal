import { useEffect } from "react";
import { useLeads } from "../../hooks/useLeads";
import useLeadsStore from "../../store/leadsStore";
import { useDebounce } from "../../hooks/useDebounce";
import style from "./LeadsTable.module.css"

export default function LeadsTable() {
  const { data, isLoading, error, isFetching } = useLeads();

  const {
    page,
    limit,
    sortField,
    sortOrder,
    status,
    owner,
    searchInput,
    setPage,
    setStatus,
    setOwner,
    setSort,
    setSearchInput,
    setSearchQuery,
  } = useLeadsStore();

  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch, setSearchQuery]);

  const leads = data?.data || [];
  const pagination = data?.pagination || {};
  const totalPages = pagination.totalPages || 1;

  if (error) return <h2>Error loading leads</h2>;

  return (
    <div style={{ marginTop: "30px" }}>
      <h2>Leads Management</h2>

      <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
        <input
          type="text"
          className={style.inputbox}
          placeholder="Search name, email, company..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={inputStyle}
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={inputStyle}
          className={style.inputbox}
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="proposal">Proposal</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>

        <input
          type="text"
          placeholder="Filter by owner"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          style={inputStyle}
          className={style.inputbox}
        />
      </div>

      {isLoading ? (
        <h3>Loading leads...</h3>
      ) : (
        <>
          {isFetching && <p>Updating...</p>}

          <table style={tableStyle} className={style.tble}>
            <thead>
              <tr>
                <th style={thStyle} onClick={() => setSort("name")}>
                  Name {sortField === "name" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                </th>
                <th style={thStyle} onClick={() => setSort("email")}>
                  Email {sortField === "email" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                </th>
                <th style={thStyle} onClick={() => setSort("company")}>
                  Company {sortField === "company" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                </th>
                <th style={thStyle} onClick={() => setSort("status")}>
                  Status {sortField === "status" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                </th>
                <th style={thStyle} onClick={() => setSort("owner")}>
                  Owner {sortField === "owner" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                </th>
                <th style={thStyle} onClick={() => setSort("createdAt")}>
                  Created Date {sortField === "createdAt" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                </th>
              </tr>
            </thead>

            <tbody>
              {leads.length > 0 ? (
                leads.map((lead) => (
                  <tr key={lead._id}>
                    <td style={tdStyle}>{lead.name}</td>
                    <td style={tdStyle}>{lead.email}</td>
                    <td style={tdStyle}>{lead.company}</td>
                    <td style={tdStyle}>{lead.status}</td>
                    <td style={tdStyle}>{lead.owner}</td>
                    <td style={tdStyle}>
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={tdStyle} colSpan="6">
                    No leads found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={paginationStyle}>
            <button disabled={page === 1} className={style.input}  onClick={() => setPage(page - 1)}>
              Prev
            </button>

            <span>
              Page {page} of {totalPages} | Limit {limit}
            </span>

            <button disabled={page >= totalPages} className={style.input} onClick={() => setPage(page + 1)}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const inputStyle = {
  padding: "10px",
  border: "1px solid #ddd",
  borderRadius: "6px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle = {
  border: "1px solid #ddd",
  padding: "12px",
  background: "#f5f5f5",
  cursor: "pointer",
  textAlign: "left",
};

const tdStyle = {
  border: "1px solid #ddd",
  padding: "12px",
};

const paginationStyle = {
  marginTop: "16px",
  display: "flex",
  gap: "12px",
  alignItems: "center",

};
