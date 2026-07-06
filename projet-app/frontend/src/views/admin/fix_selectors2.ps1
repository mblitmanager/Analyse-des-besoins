$content = Get-Content P3OverrideConfigView.vue -Raw
$content = $content -replace '<option value="`<">=</option>', '<option value="`<"><</option>'
$content = $content -replace '<option value="`>">=</option>', '<option value="`>">></option>'
$content = $content -replace '(<option value="`<">=</option>\s*){2}', '<option value="`<"><</option>'
Set-Content P3OverrideConfigView.vue -Value $content
