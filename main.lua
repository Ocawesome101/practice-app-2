local hfile = require("xavante.filehandler")
local hcgi = require "xavante.cgiluahandler"
local hredir = require "xavante.redirecthandler"

local xavante = require "xavante"
  
-- Define here where Xavante HTTP documents scripts are located
local webDir = "./websrc"

local simplerules = {
  { -- URI remapping
    match = "^[^%./]*/$",
    with = hredir,
    params = {"index.lua"}
  }, 

  { -- cgilua
    match = {"%.lua$", "%.lua/.*$" },
    with = hcgi.makeHandler (webDir)
  },

  { -- files
    match = ".",
    with = hfile,
    params = {baseDir = webDir}
  },
}

xavante.HTTP {
  server = {host = "*", port = 8080},

  defaultHost = {
    rules = simplerules
  },
}

xavante.start()
