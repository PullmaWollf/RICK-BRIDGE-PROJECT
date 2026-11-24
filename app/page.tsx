export default function Home() {
  return <main className="shell"><section className="panel">
    <div className="eyebrow">PRIVATE FILE INFRASTRUCTURE</div>
    <h1>RICK BRIDGE <span>SERVER</span></h1>
    <p className="lead">REST + MCP · Vercel Functions · Private Blob Storage</p>
    <div className="grid">
      <a href="/api/health"><b>Health check</b><small>Verificar configuração</small></a>
      <div><b>REST API</b><small>/api/files · /api/shared/:id</small></div>
      <div><b>MCP endpoint</b><small>/api/mcp · Streamable HTTP</small></div>
    </div>
    <p className="warning">Os arquivos são privados. Links temporários concedem acesso somente ao arquivo associado ao token.</p>
  </section></main>;
}
