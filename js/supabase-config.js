const SUPABASE_URL = "https://jmoosxtoiulssgsppbne.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imptb29zeHRvaXVsc3Nnc3BwYm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NDk0MTEsImV4cCI6MjA5ODMyNTQxMX0.6mpGH-a_DO95Ei063vDvrb18fEbPvtPhAaz9zvR4wNQ";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

window.supabaseClient = supabaseClient;

function mapSupabaseProject(item) {
  return {
    id: item.slug,
    title: item.title,
    category: item.category || [],
    shortDescription: item.short_description || "",
    problem: item.problem || "",
    objective: item.objective || "",
    targetUser: item.target_user || "",
    role: item.role || "",
    techStack: item.tech_stack || [],
    features: item.features || [],
    systemFlow: item.system_flow || [],
    result: item.result || "",
    challenges: item.challenges || [],
    lessonsLearned: item.lessons_learned || "",
    futureImprovement: item.future_improvement || "",
    github: item.github_url || "",
    demo: item.demo_url || "",
    report: item.report_url || "",
    images: item.image_url
      ? [item.image_url]
      : ["assets/images/projects/placeholder-project.png"],
    status: item.status || "Selesai",
    year: item.year || "",
    featured: item.featured || false
  };
}

async function loadProjectsData() {
  try {
    if (!window.supabaseClient) {
      throw new Error("Supabase client belum tersedia. Periksa urutan script.");
    }

    const { data, error } = await window.supabaseClient
      .from("projects")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      return data.map(mapSupabaseProject);
    }

    console.warn("Data Supabase kosong. Menggunakan fallback projects.json.");
    return await loadFallbackProjects();
  } catch (error) {
    console.error("Gagal mengambil data dari Supabase:", error);
    return await loadFallbackProjects();
  }
}
window.loadProjectsData = loadProjectsData;

async function loadFallbackProjects() {
  try {
    const response = await fetch("data/projects.json");

    if (!response.ok) {
      throw new Error("Fallback projects.json tidak ditemukan.");
    }

    const fallbackData = await response.json();
    return fallbackData;
  } catch (fallbackError) {
    console.error("Gagal mengambil fallback projects.json:", fallbackError);
    return [];
  }
}
