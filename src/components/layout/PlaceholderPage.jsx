import { Box, Typography, Paper } from '@mui/material'

export default function PlaceholderPage({ title, description }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        background: 'rgba(255,255,255,0.8)',
      }}
    >
      <Box>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography color="text.secondary">{description}</Typography>
      </Box>
    </Paper>
  )
}
