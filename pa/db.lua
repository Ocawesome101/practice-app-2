local stat = require("posix.sys.stat")
local dirent = require("posix.dirent")

local db = {}

local DB_BASE = os.getenv("PRACTICEAPP_DB_BASE") or "./db"

function db.get(path, sort)
  path = DB_BASE .. "/" .. path:gsub("%.%.", "")
  local sx = stat.stat(path)
  if not sx then error ("bad db.get call: " .. path) end
  if stat.S_ISDIR(sx.st_mode) == 0 then
    local hand = io.open(path, "r")
    return hand:read("a"), hand:close() -- hah
  else
    local ret = {}
    for file in dirent.files(path) do
      if file ~= "." and file ~= ".." then
        ret[#ret+1] = file
      end
    end
    if sort then table.sort(ret) end
    return ret
  end
end

function db.create(path, content)
  path = DB_BASE .. "/" .. path:gsub("%.%.", "")
  local handle = io.open(path, "w")
  if not handle then error ("bad db.create call: " .. path) end
  handle:write(content or "")
  handle:close()
end

function db.createDir(path)
  path = DB_BASE .. "/" .. path:gsub("%.%.", "")
  assert(stat.mkdir(path))
end

function db.remove(path)
  path = DB_BASE .. "/" .. path:gsub("%.%.", "")
  os.execute("rm -r " .. path)
end

return db
