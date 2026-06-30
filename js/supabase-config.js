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
    dbId: item.id,
    slug: item.slug,
    title: item.title,
    category: item.category || [],
    shortDescription: item.short_description || "",
    problem: item.problem || "",
    objective: item.objective || "",
    targetUser: item.target_user || "",
    role: item.role || "",
    techStack: typeof item.tech_stack === 'string' ? JSON.parse(item.tech_stack) : (item.tech_stack || []),
    features: typeof item.features === 'string' ? JSON.parse(item.features) : (item.features || []),
    systemFlow: typeof item.system_flow === 'string' ? JSON.parse(item.system_flow) : (item.system_flow || []),
    result: item.result || "",
    challenges: typeof item.challenges === 'string' ? JSON.parse(item.challenges) : (item.challenges || []),
    lessonsLearned: item.lessons_learned || "",
    futureImprovement: item.future_improvement || "",
    github: item.github_url || "",
    demo: item.demo_url || "",
    report: item.report_url || "",
    images: Array.isArray(item.image_urls) ? item.image_urls : (typeof item.image_urls === 'string' && item.image_urls.startsWith('[')) ? JSON.parse(item.image_urls) : (item.image_url ? (typeof item.image_url === 'string' && item.image_url.startsWith('[') ? JSON.parse(item.image_url) : [item.image_url]) : ["assets/images/projects/placeholder-project.png"]),
    imageUrl: (Array.isArray(item.image_urls) && item.image_urls.length > 0) ? item.image_urls[0] : (item.image_url ? (typeof item.image_url === 'string' && item.image_url.startsWith('[') ? JSON.parse(item.image_url)[0] : item.image_url) : ""),
    status: item.status || "Selesai",
    year: item.year || "",
    featured: item.featured || false,
    isActive: item.is_active !== false,
    displayOrder: item.display_order || 0,
    createdAt: item.created_at || "",
    updatedAt: item.updated_at || ""
  };
}
window.mapSupabaseProject = mapSupabaseProject;

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

window.loadProjectsData = async function () {
  if (!window.supabaseClient) {
    console.error("Supabase client is not initialized");
    return loadFallbackProjects();
  }

  try {
    const { data, error } = await window.supabaseClient
      .from("projects")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error.message);
      return loadFallbackProjects();
    }

    if (data && data.length > 0) {
      // Map data according to requirements
      return data.map(mapSupabaseProject);
    } else {
      return [];
    }
  } catch (error) {
    console.error("Fetch error:", error);
    return loadFallbackProjects();
  }
};
