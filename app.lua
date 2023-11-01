-- luarocks install lapis --lua-version=5.1
-- link /usr/lib/lua/5.1 to /usr/local/lib/lua/5.1
-- and /usr/share/lua/5.1 to /usr/local/share/lua/5.1
local lapis = require("lapis")
local tmpl = require("pa.template")
local db = require("pa.db")
local util = require("lapis.util")
local app = lapis.Application()

local function date()
  return os.date("%Y-%m-%d")
end

app:get("/", function()
  return tmpl("templates/homepage.ltmp")
end)

app:get("/api/assignments", function()
  local ids = db.get("/assignments")
  local resp = {}
  for i=1, #ids do
    resp[#resp+1] = {name=db.get("/assignments/"..ids[i]), id=ids[i]}
  end
  ngx.print(util.to_json(resp))
  return {skip_render = true}
end)

app:get("/api/practiced", function()
  local a, ids = pcall(db.get, "/practiced/" .. date())
  if not a then ids = {} end
  local resp = {}
  for i=1, #ids do
    resp[#resp+1] = {id=ids[i], time=db.get("/practiced/"..date().."/"..ids[i])}
  end
  ngx.print(util.to_json(resp))
  return {skip_render = true}
end)

app:get("/api/lists", function()
  local names = db.get("/lists")
  local resp = {}
  for i=1, #names do
    resp[names[i]] = db.get("/lists/"..names[i])
  end
  ngx.print(util.to_json(resp))
  return {skip_render = true}
end)

app:post("/api/create", function(req)
  math.randomseed(os.time())
  local id = tonumber(req.params.id or math.random(100000,999999))
  db.create("/assignments/"..id, util.unescape(req.params.assignmentName))
  ngx.print(id)
  return {skip_render = true}
end)

app:post("/api/updatelist", function(req)
  db.remove("/lists/"..req.params.listName)
  if req.params.listMembers and #req.params.listMembers > 0 then
    db.createDir("/lists/"..req.params.listName)
    for mem in req.params.listMembers:gmatch("[^,]+") do
      db.create("/lists/"..req.params.listName.."/"..mem)
    end
  end
  return {skip_render = true}
end)

app:post("/api/practice", function(req)
  pcall(db.createDir, "/practiced/" .. date())
  db.create("/practiced/"..date().."/"..req.params.id, req.params.time)
  return {skip_render = true}
end)

app:post("/api/remove", function(req)
  pcall(db.remove, "/assignments/"..req.params.id)
end)

return app
