-- luarocks install lapis --lua-version=5.1
-- link /usr/lib/lua/5.1 to /usr/local/lib/lua/5.1
-- and /usr/share/lua/5.1 to /usr/local/share/lua/5.1
local lapis = require("lapis")
local tmpl = require("pa.template")
local db = require("pa.db")
local util = require("lapis.util")
local app = lapis.Application()

app:get("/", function()
  return tmpl("templates/homepage.ltmp")
end)

app:get("/api/assignments", function()
  ngx.print(util.to_json(db.get("/assignments")))
  return {
    skip_render = true,
  }
end)

app:get("/api/lists", function()
  ngx.print(util.to_json(db.get("/lists")))
  return {skip_render = true}
end)

app:post("/api/create", function(req)
  math.randomseed(os.time())
  local id = math.random(100000,999999)
  db.create("/assignments/"..id, util.unescape(req.params.assignmentName))
  ngx.print(id)
  return {skip_render = true, redirect_to = "/"}
end)

return app
