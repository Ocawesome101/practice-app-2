#!/usr/bin/env lua
-- process a template as Lua code

local stat = require("posix.sys.stat")
local dirent = require("posix.dirent")
local db = require("pa.db")

local function open(name, args)
  local base = "<" .. name
  for k, v in pairs(args) do
    if type(k) == "string" then
      base = base .. string.format(" %s=%q", k, v)
    end
  end
  return base .. ">"
end

local function close(name)
  return "</"..name..">"
end

local elements
elements = setmetatable({
  stylesheet = function(p)
    return open("link", {rel="stylesheet", href=p})
  end,
  script = function(p)
    return open("script", {type="text/javascript", src=p})..close("script")
  end,
  include = function(p)
    assert(loadfile(p, "t", elements))()
    return ""
  end,
  foreach = function(items)
    return function(lines)
      local ret = ""
      for i=1, #items do
        for l=1, #lines do
          ret = ret .. lines[l]
            :gsub("%$%$i", items[i])
            :gsub("%$%$db%.([a-z]*)(%b())", function(method, call)
              local result = db[method](call:sub(2,-2))
              if type(result) == "string" then return result end
              for i=1, #result do result[i] = string.format("%q", result) end
              return table.concat(result, ", ")
            end)
        end
      end
      return ret
    end
  end,
  br = "<br>";
}, {__index = function(t, k)
  t[k] = function(args)
    local elem = open(k, args)
    for i=1, #args do
      elem = elem .. args[i]
    end
    return elem .. close(k)
  end
  return t[k]
end})

elements.db = db

local function dotemplate(file)
  local hand = io.open(file, "r")
  local data = hand:read("a")
  hand:close()
  data = "return { " .. data .. " }"
  return "<!DOCTYPE html>\n<meta charset='utf-8'>\n"
    .. table.concat(assert(load(data, "="..file, "t", elements))(), "\n")
end

return dotemplate
