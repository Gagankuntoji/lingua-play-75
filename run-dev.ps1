# PowerShell script to run the dev server
# This bypasses execution policy issues

# Change to project directory
Set-Location $PSScriptRoot

# Run npm dev using cmd to bypass PowerShell execution policy
cmd /c "npm run dev"

