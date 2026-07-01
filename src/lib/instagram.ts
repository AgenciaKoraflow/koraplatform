// Instagram Graph API Integration
const INSTAGRAM_API_BASE = "https://graph.instagram.com/v18.0";

const INSTAGRAM_CONFIG = {
  appId: "1314783690285550",
  appSecret: "88af4abd524dece3faf9db2cb9f19ca9",
  token: "IGAASrye7Q4e5BZAFpQeS1KNDFpU05vRlp1Y2lldzZAla3FmblI5cEsyZAUozcV82b2o2QnVCNzFhdTNIM3R0R0RjS2hlTDBkdWsxcTdoaERjZA0UxeG16RldfNkltX0o2OGxNV0NUaUQ3Y3VPQ1d2WXBpUXNqRF80ZAzBScmNwcU1MTQZDZD",
  businessAccountId: "27571261272563142", // @koraflow.ia (Instagram User ID)
};

export interface InstagramMetrics {
  followers: number;
  engagement: number;
  reelsViews: number;
  saves: number;
  comments: number;
  shares: number;
  profileVisits: number;
  growth7d: number;
}

export interface InstagramReel {
  id: string;
  caption: string;
  mediaType: string;
  mediaProductType: string;
  permalink: string;
  timestamp: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

// Buscar dados de insights da conta
export async function fetchInstagramMetrics(): Promise<InstagramMetrics | null> {
  try {
    // Para conta de usuário, os insights disponíveis são limitados
    // Usamos dados baseados nos posts/reels da conta
    const url = `${INSTAGRAM_API_BASE}/${INSTAGRAM_CONFIG.businessAccountId}?fields=id,name,username,biography,followers_count,media_count&access_token=${INSTAGRAM_CONFIG.token}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error("Instagram API error:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    console.log("✅ Dados de conta carregados:", data);

    // Buscar últimos reels para calcular engajamento
    const mediaUrl = `${INSTAGRAM_API_BASE}/${INSTAGRAM_CONFIG.businessAccountId}/media?fields=id,media_type&limit=10&access_token=${INSTAGRAM_CONFIG.token}`;
    const mediaResponse = await fetch(mediaUrl);
    const mediaData = await mediaResponse.json();

    let totalLikes = 0;
    let totalComments = 0;
    let totalSaves = 0;

    // Buscar insights de cada media
    if (mediaData.data && mediaData.data.length > 0) {
      for (const media of mediaData.data) {
        try {
          const insightUrl = `${INSTAGRAM_API_BASE}/${media.id}/insights?metric=likes,comments,saved&access_token=${INSTAGRAM_CONFIG.token}`;
          const insightResponse = await fetch(insightUrl);
          const insightData = await insightResponse.json();

          if (insightData.data) {
            for (const metric of insightData.data) {
              if (metric.name === "likes") totalLikes += metric.values[0]?.value || 0;
              if (metric.name === "comments") totalComments += metric.values[0]?.value || 0;
              if (metric.name === "saved") totalSaves += metric.values[0]?.value || 0;
            }
          }
        } catch (e) {
          console.warn("Erro ao buscar insights do media:", e);
        }
      }
    }

    return {
      followers: data.followers_count || 1000,
      engagement: 0.045,
      reelsViews: totalLikes * 15, // Estimativa: média de 15 views por like
      saves: totalSaves,
      comments: totalComments,
      shares: Math.floor((totalLikes + totalComments) * 0.08),
      profileVisits: Math.floor(data.followers_count * 0.04),
      growth7d: Math.floor(data.followers_count * 0.012),
    };
  } catch (error) {
    console.error("Erro ao buscar métricas do Instagram:", error);
    return null;
  }
}

// Buscar últimos reels com insights
export async function fetchInstagramReels(limit = 10): Promise<InstagramReel[] | null> {
  try {
    const fields = "id,caption,media_type,permalink,timestamp";
    const url = `${INSTAGRAM_API_BASE}/${INSTAGRAM_CONFIG.businessAccountId}/media?fields=${fields}&limit=${limit}&access_token=${INSTAGRAM_CONFIG.token}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error("Instagram API error:", response.status, response.statusText);
      return mockReels();
    }

    const data = await response.json();
    const reels: InstagramReel[] = [];

    if (data.data && data.data.length > 0) {
      for (const media of data.data) {
        try {
          // Buscar insights para este media
          const insightsUrl = `${INSTAGRAM_API_BASE}/${media.id}/insights?metric=likes,comments,saved&access_token=${INSTAGRAM_CONFIG.token}`;
          const insightsResponse = await fetch(insightsUrl);
          const insightsData = await insightsResponse.json();

          let likes = 0;
          let comments = 0;
          let saves = 0;

          if (insightsData.data) {
            for (const metric of insightsData.data) {
              if (metric.name === "likes") likes = metric.values[0]?.value || 0;
              if (metric.name === "comments") comments = metric.values[0]?.value || 0;
              if (metric.name === "saved") saves = metric.values[0]?.value || 0;
            }
          }

          reels.push({
            id: media.id,
            caption: media.caption || "(Sem descrição)",
            mediaType: media.media_type,
            mediaProductType: media.media_type === "VIDEO" ? "REELS" : "CAROUSEL_ALBUM",
            permalink: media.permalink,
            timestamp: media.timestamp,
            views: Math.floor(likes * 15), // Estimativa de views baseado em likes
            likes: likes,
            comments: comments,
            shares: Math.floor((likes + comments) * 0.08),
            saves: saves,
          });
        } catch (error) {
          console.warn(`Erro ao buscar insights do reel ${media.id}:`, error);
        }
      }
    }

    return reels.length > 0 ? reels : mockReels();
  } catch (error) {
    console.error("Erro ao buscar reels do Instagram:", error);
    return mockReels();
  }
}

// Dados mockados para fallback
function mockReels(): InstagramReel[] {
  return [
    {
      id: "1",
      caption: "Você precisa de um painel de conteúdo viral",
      mediaType: "VIDEO",
      mediaProductType: "REELS",
      permalink: "https://instagram.com/p/123",
      timestamp: new Date().toISOString(),
      views: 287400,
      likes: 4812,
      comments: 892,
      shares: 1200,
      saves: 4812,
    },
    {
      id: "2",
      caption: "Para de usar Notion para gerenciar conteúdo",
      mediaType: "VIDEO",
      mediaProductType: "REELS",
      permalink: "https://instagram.com/p/124",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      views: 156800,
      likes: 3421,
      comments: 567,
      shares: 890,
      saves: 3421,
    },
    {
      id: "3",
      caption: "Como criei um sistema de automação em 7 dias",
      mediaType: "VIDEO",
      mediaProductType: "REELS",
      permalink: "https://instagram.com/p/125",
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      views: 98900,
      likes: 2103,
      comments: 234,
      shares: 456,
      saves: 2103,
    },
    {
      id: "4",
      caption: "A maioria dos criadores não sabe isso sobre hooks",
      mediaType: "VIDEO",
      mediaProductType: "REELS",
      permalink: "https://instagram.com/p/126",
      timestamp: new Date(Date.now() - 259200000).toISOString(),
      views: 76200,
      likes: 1892,
      comments: 189,
      shares: 234,
      saves: 1892,
    },
    {
      id: "5",
      caption: "Você não sabe quanto vale seu tempo",
      mediaType: "VIDEO",
      mediaProductType: "REELS",
      permalink: "https://instagram.com/p/127",
      timestamp: new Date(Date.now() - 345600000).toISOString(),
      views: 54300,
      likes: 987,
      comments: 123,
      shares: 145,
      saves: 987,
    },
  ];
}

// Validar token
export async function validateInstagramToken(): Promise<boolean> {
  try {
    // Tentar validar usando o Business Account ID
    const url = `${INSTAGRAM_API_BASE}/${INSTAGRAM_CONFIG.businessAccountId}?fields=id,name,username&access_token=${INSTAGRAM_CONFIG.token}`;
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Token válido! Conta conectada:", data.username);
      return true;
    }

    if (response.status === 400) {
      console.error("❌ Token inválido ou expirado");
      console.error("Status: 400 Bad Request");
      console.error("Verifique se o token ainda é válido em https://developers.facebook.com/tools/explorer/");
      return false;
    }

    return false;
  } catch (error) {
    console.error("Erro ao validar token do Instagram:", error);
    return false;
  }
}
