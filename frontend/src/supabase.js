

import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://rgfibdvguzrriqyhvqro.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnZmliZHZndXpycmlxeWh2cXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNTIzNDEsImV4cCI6MjA4NTYyODM0MX0.aoTv0Q6offGfiNRtA-qpIbUSj_KNK9lfXPUpYsmxYSM"
);