import { motion, AnimatePresence, useMotionValue, useInView } from 'motion/react';
import { 
  Terminal, 
  Cpu, 
  Send, 
  ExternalLink,
  Code2,
  Palette,
  AlertTriangle,
  Sun,
  Moon,
  Instagram
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import TurntablePlayer from './components/TurntablePlayer';

type Lang = 'pt' | 'en';

interface PortfolioItem { id: string; title: string; tags: string[]; image: string; }
interface QueueItem { id: string; client: string; type: string; progress: number; status: string; stage_pt: string; stage_en: string; }
interface SocialLink { id: string; href: string; title: string; }
interface Tier { id: string; name_pt: string; name_en: string; price_pt: string; price_en: string; details_pt: string[]; details_en: string[]; hasCheckboxes?: boolean; price_medium_pt?: string; price_medium_en?: string; price_advanced_pt?: string; price_advanced_en?: string; price_complex_pt?: string; price_complex_en?: string; }
interface SiteConfig { artist: { name: string; tagline: string; description_pt: string; description_en: string }; social: SocialLink[]; commissions: { status: string; statusLabel_pt: string; statusLabel_en: string }; stats: { projects: number; retention: number; pixels: number }; tos: string[]; }
interface PricingData { tiers: Tier[]; extras_pt: string[]; extras_en: string[]; }

const TRANSLATIONS = {
  pt: {
    nav: { gallery: './GALERIA', queue: './FILA', commissions: './COMISSÕES', statusOpen: 'COMISSÕES: OPEN' },
    hero: { status: 'status_code: 200 OK', title1: 'Minus', title2: 'one', title3: 'Step', title4: 'for you to get your', title5: 'art', desc: '> Hello World! Eu sou StepMinus, Artista digital 2D focado em animais antropomorfizados. Estamos conectados?', btnGallery: 'VER_GALERIA.exe', btnPrices: 'VER_PREÇOS.exe' },
    gallery: { title: 'GALERIA_DE_ARTES', path: '> /root/works/gallery', files: 'FILES_FOUND', all: 'ALL' },
    queue: { title: './FILA_DE_PROJETOS', subtitle: '> STATUS EM TEMPO REAL DAS COMISSÕES ATIVAS.', online: 'SISTEMA ONLINE', client: 'CLIENTE', status: 'STATUS' },
    commissions: { path: 'minus@commissions: ~/prices', title: 'Protocolo_de_Comissão', subtitle: 'SELECIONE O TIER DESEJADO', base: 'BASE', selectMode: 'SELECT_MODE()', tosTitle: 'TERMS_OF_SERVICE.txt', tosRules: ['1. Pagamento 50% adiantado via PayPal ou Pix. Restante na finalização.', '2. Até 3 revisões gratuitas durante o processo de lineart/cores base.', '3. Prazo de entrega varia de 1 a 3 semanas dependendo da complexidade do projeto.', '4. Não desenho: NSFW extremo, mecha hyper-realista, gore pesado.'] },
    stats: { projects: 'Projetos Concluídos', retention: 'Retenção de Clientes', pixels: 'Pixels Renderizados' },
    footer: { copy: 'MINUS_OS V.1.0 © 2026' },
    boot: { modules: 'BURLANDO FIREWALLS DE SEGURANÇA...', engine: 'INJETANDO PROTOCOLO BREACH.EXE...', db: 'DESCRIPTOGRAFANDO BANCO DE ARTES...', online: 'INTRUSÃO COMPLETA: SISTEMA COMPROMETIDO_' },
    modal: { close: '[ X ] CLOSE PROCESS' }
  },
  en: {
    nav: { gallery: './GALLERY', queue: './QUEUE', commissions: './COMMISSIONS', statusOpen: 'COMMISSIONS: OPEN' },
    hero: { status: 'status_code: 200 OK', title1: 'Minus', title2: 'one', title3: 'Step', title4: 'for you to get your', title5: 'art', desc: '> Hello World! I am StepMinus, a 2D digital artist focused on anthropomorphic animals. Are we connected?', btnGallery: 'VIEW_GALLERY.exe', btnPrices: 'VIEW_PRICING.exe' },
    gallery: { title: 'ART_GALLERY', path: '> /root/works/gallery', files: 'FILES_FOUND', all: 'ALL' },
    queue: { title: './PROJECT_QUEUE', subtitle: '> REAL-TIME STATUS OF ACTIVE COMMISSIONS.', online: 'SYSTEM ONLINE', client: 'CLIENT', status: 'STATUS' },
    commissions: { path: 'minus@commissions: ~/prices', title: 'Commission_Protocol', subtitle: 'SELECT YOUR DESIRED TIER', base: 'BASE', selectMode: 'SELECT_MODE()', tosTitle: 'TERMS_OF_SERVICE.txt', tosRules: ['1. 50% upfront payment via PayPal or Pix. Remaining upon completion.', '2. Up to 3 free revisions during the lineart/base colors process.', '3. Delivery time varies from 1 to 3 weeks depending on project complexity.', '4. I won\'t draw: Extreme NSFW, hyper-realistic mecha, heavy gore.'] },
    stats: { projects: 'Completed Projects', retention: 'Client Retention', pixels: 'Rendered Pixels' },
    footer: { copy: 'MINUS_OS V.1.0 © 2026' },
    boot: { modules: 'BYPASSING SECURITY FIREWALLS...', engine: 'INJECTING BREACH.EXE PROTOCOL...', db: 'DECRYPTING ARTWORK DATABASE...', online: 'INTRUSION COMPLETE: SYSTEM COMPROMISED_' },
    modal: { close: '[ X ] CLOSE PROCESS' }
  }
} as const;

// --- ICONS ---
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" /></svg>
);

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" /></svg>
);

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.676c.223-.2-.054-.31-.346-.11l-6.4 4.02-2.76-.86c-.6-.184-.614-.6.125-.89l10.82-4.17c.5-.187.942.112.793.896z" /></svg>
);

const socialLinks_DEFAULT: SocialLink[] = [
  { id: 'x', href: 'https://x.com', title: 'X / Twitter' },
  { id: 'instagram', href: 'https://instagram.com', title: 'Instagram' },
  { id: 'discord', href: 'https://discord.com', title: 'Discord' },
  { id: 'telegram', href: 'https://telegram.org', title: 'Telegram' }
];

const SOCIAL_ICONS: Record<string, React.FC<{ className?: string }>> = {
  x: XIcon,
  instagram: Instagram,
  discord: DiscordIcon,
  telegram: TelegramIcon,
};

const SocialIcon = ({ id, className }: { id: string; className?: string }) => {
  const Icon = SOCIAL_ICONS[id];
  return Icon ? <Icon className={className} /> : null;
};

// --- AUDIO SYSTEM ---
const createAudioContext = () => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  return new AudioContext();
};

let audioCtx: AudioContext | null = null;

const playClickSound = () => {
  try {
    if (!audioCtx) audioCtx = createAudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  } catch (e) { console.warn('Audio play failed', e); }
};

const playOpenSound = () => {
  try {
    if (!audioCtx) audioCtx = createAudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.03, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.15);
  } catch (e) { console.warn('Audio play failed', e); }
};

const PORTFOLIO_DEFAULT: PortfolioItem[] = [];

const getQueueDefault = (lang: Lang): QueueItem[] => [];

const DEFAULT_CONFIG: SiteConfig = {
  artist: { name: 'Minus', tagline: 'one Step for you to get your art', description_pt: '> Hello World!', description_en: '> Hello World!' },
  social: socialLinks_DEFAULT,
  commissions: { status: 'open', statusLabel_pt: 'COMISSOES: OPEN', statusLabel_en: 'COMMISSIONS: OPEN' },
  stats: { projects: 0, retention: 0, pixels: 0 },
  tos: []
};

const DEFAULT_PRICING: PricingData = { tiers: [], extras_pt: [], extras_en: [] };

const ALL_TAGS_DEFAULT = Array.from(new Set(PORTFOLIO_DEFAULT.flatMap(i => i.tags))).sort();

const AnimatedCounter = ({ value, duration = 2 }: { value: number; duration?: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (inView) {
      let start = 0;
      const end = value;
      const totalMilSecDur = duration * 1000;
      let startTime: number | null = null;
      
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / totalMilSecDur, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setCount(Math.floor(easeOutQuart * (end - start) + start));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    }
  }, [inView, value, duration]);

  return <span ref={ref}>{count}</span>;
};

const PacmanGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;
    
    const handleResize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    let mouseX = width / 2;
    let mouseY = height - 40;
    let isMouseOver = false;

    const updateMouse = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      if ('touches' in e && e.touches.length > 0) {
        mouseX = e.touches[0].clientX - rect.left;
        isMouseOver = true;
      } else if ('clientX' in e) {
        mouseX = e.clientX - rect.left;
        isMouseOver = true;
      }
    };

    const handleMouseLeave = () => { isMouseOver = false; };

    canvas.addEventListener('mousemove', updateMouse as any);
    canvas.addEventListener('touchmove', updateMouse as any);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('touchend', handleMouseLeave);

    let frame = 0;
    let score = 0;
    let lastX = width / 2;
    let direction = -Math.PI / 2; 
    let mouthTimer = 0;

    type Item = { x: number; y: number; speed: number; type: 'star' | 'number'; value: string; color: string; size: number };
    const items: Item[] = [];

    type Confetti = { x: number; y: number; vx: number; vy: number; color: string; size: number; rotation: number; angularSpeed: number };
    let confettis: Confetti[] = [];
    let isCelebrating = false;
    let shakeTimer = 0;

    const colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#9D4EDD'];

    const spawnItem = () => {
      items.push({
        x: 20 + Math.random() * (width - 40),
        y: -30,
        speed: 0.5 + Math.random() * 1.5,
        type: Math.random() > 0.5 ? 'star' : 'number',
        value: Math.floor(Math.random() * 10).toString(),
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 10 + Math.random() * 10
      });
    };

    const loop = () => {
      ctx.clearRect(0, 0, width, height);
      frame++;

      if (score === 67 && !isCelebrating) {
        isCelebrating = true;
        shakeTimer = 40; // ~0.6 seconds of shake
        for (let i = 0; i < 150; i++) {
          confettis.push({
            x: width / 2,
            y: height / 2,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20 - 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 5 + Math.random() * 8,
            rotation: Math.random() * Math.PI * 2,
            angularSpeed: (Math.random() - 0.5) * 0.5
          });
        }
      }

      ctx.save();
      if (shakeTimer > 0) {
        shakeTimer--;
        ctx.translate((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15);
      }

      if (frame % 80 === 0) spawnItem();

      // Lock to the floor
      mouseY = height - 40;

      const dx = mouseX - lastX;
      
      if (Math.abs(dx) > 1) {
        direction = dx > 0 ? 0 : Math.PI;
      } else if (!isMouseOver) {
        direction = -Math.PI / 2;
      } else {
        direction = -Math.PI / 2;
      }
      
      lastX = mouseX;

      const pacmanRadius = 22;

      let isOpeningMouth = false;

      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.y += item.speed;

        ctx.fillStyle = item.color;
        if (item.type === 'number') {
          ctx.font = `bold ${item.size * 2}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.value, item.x, item.y);
        } else {
          ctx.beginPath();
          for (let j = 0; j < 5; j++) {
            ctx.lineTo(Math.cos((18 + j * 72) / 180 * Math.PI) * item.size + item.x,
                       -Math.sin((18 + j * 72) / 180 * Math.PI) * item.size + item.y);
            ctx.lineTo(Math.cos((54 + j * 72) / 180 * Math.PI) * (item.size/2) + item.x,
                       -Math.sin((54 + j * 72) / 180 * Math.PI) * (item.size/2) + item.y);
          }
          ctx.closePath();
          ctx.fill();
        }

        const dist = Math.hypot(mouseX - item.x, mouseY - item.y);

        if (dist < pacmanRadius + item.size + 40) {
          isOpeningMouth = true;
        }

        if (dist < pacmanRadius + item.size) {
          score++;
          items.splice(i, 1);
          mouthTimer = 10;
          continue;
        }

        if (item.y > height + 20) {
          items.splice(i, 1);
        }
      }

      if (mouthTimer > 0) {
        mouthTimer--;
      }
      
      // Open mouth when close to an item or recently ate one
      const isOpen = isOpeningMouth || mouthTimer > 0;

      ctx.save();
      ctx.translate(mouseX, mouseY);
      
      // Since pacman direction was 0 (right), PI (left), -PI/2 (up)
      // And the sprites likely face front, we can just flip horizontally based on direction
      // However, for front-facing Sprites, making them face left or right using scale(-1, 1).
      // We assume they usually face right or it's symmetrical.
      if (direction === Math.PI || direction === -Math.PI) {
        ctx.scale(-1, 1);
      }

      // Draw cat emoji instead of custom SVG or fallback Pacman
      ctx.font = '52px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", "Android Emoji", emoji, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.fillText(isOpen ? '😺' : '🐱', 0, 0);
      ctx.restore();

      ctx.fillStyle = '#FFD93D';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`SCORE: ${score}`, 20, 20);

      // update and draw confetti
      for (let i = confettis.length - 1; i >= 0; i--) {
        const c = confettis[i];
        c.x += c.vx;
        c.y += c.vy;
        c.vy += 0.4; // gravity
        c.rotation += c.angularSpeed;
        
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size);
        ctx.restore();
        
        if (c.y > height + 20) {
          confettis.splice(i, 1);
        }
      }

      ctx.restore(); // end of screen shake save

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', updateMouse as any);
      canvas.removeEventListener('touchmove', updateMouse as any);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('touchend', handleMouseLeave);
    };
  }, []);

  return (
    <div className="w-full bg-surface/30 border-t border-rosy/20 overflow-hidden relative h-[400px] mt-32">
      <div className="absolute top-4 left-0 w-full text-center text-xs text-almond/30 font-mono pointer-events-none select-none">
        /// SYSTEM_IDLE_MINIGAME.exe
      </div>
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block cursor-none"
      />
    </div>
  );
};

export default function App() {
  const [lang, setLang] = useState<Lang>('en');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<PortfolioItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const [isHovering, setIsHovering] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);
  const [refSheetLevel, setRefSheetLevel] = useState<'base' | 'media' | 'avancada' | 'complexa'>('base');
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: light)').matches;
    }
    return false;
  });

  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(PORTFOLIO_DEFAULT);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [pricingData, setPricingData] = useState<PricingData>(DEFAULT_PRICING);

  useEffect(() => {
    const base = import.meta.env.BASE_URL || './';
    Promise.allSettled([
      fetch(`${base}data/config.json`).then(r => r.ok ? r.json() : DEFAULT_CONFIG),
      fetch(`${base}data/portfolio.json`).then(r => r.ok ? r.json() : { items: PORTFOLIO_DEFAULT }),
      fetch(`${base}data/queue.json`).then(r => r.ok ? r.json() : { items: [] }),
      fetch(`${base}data/pricing.json`).then(r => r.ok ? r.json() : DEFAULT_PRICING),
    ]).then(([cfg, port, queue, price]) => {
      if (cfg.status === 'fulfilled') setSiteConfig(cfg.value as SiteConfig);
      if (port.status === 'fulfilled') setPortfolioItems((port.value as { items: PortfolioItem[] }).items || PORTFOLIO_DEFAULT);
      if (queue.status === 'fulfilled') setQueueItems((queue.value as { items: QueueItem[] }).items || []);
      if (price.status === 'fulfilled') setPricingData(price.value as PricingData);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (navigator.language.toLowerCase().startsWith('pt')) {
      setLang('pt');
    }
    
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
      const handleChange = (e: MediaQueryListEvent) => {
        setIsLightTheme(e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const t = TRANSLATIONS[lang];
  const socialLinks = siteConfig.social;

  const activeCommissions = queueItems.map(q => ({
    ...q,
    stage: lang === 'pt' ? q.stage_pt : q.stage_en,
    icon: <Cpu className="w-4 h-4"/>
  }));

  const getRefPrice = () => {
    const tier = pricingData.tiers.find(tier => tier.id === 'TIER_D');
    if (!tier) return { pt: 'R$ 100', en: '$ 85' };
    if (refSheetLevel === 'media') return { pt: tier.price_medium_pt || 'R$ 135', en: tier.price_medium_en || '$ 100' };
    if (refSheetLevel === 'avancada') return { pt: tier.price_advanced_pt || 'R$ 165', en: tier.price_advanced_en || '$ 120' };
    if (refSheetLevel === 'complexa') return { pt: tier.price_complex_pt || 'R$ 215', en: tier.price_complex_en || '$ 140' };
    return { pt: tier.price_pt, en: tier.price_en };
  };
  const refPrice = getRefPrice();

  const commissionTiers = pricingData.tiers.map(tier => ({
    ...tier,
    name: lang === 'pt' ? tier.name_pt : tier.name_en,
    price: tier.id === 'TIER_D' ? (lang === 'pt' ? refPrice.pt : refPrice.en) : (lang === 'pt' ? tier.price_pt : tier.price_en),
    details: lang === 'pt' ? tier.details_pt : tier.details_en,
  }));

  const pricingExtras = lang === 'pt' ? pricingData.extras_pt : pricingData.extras_en;
  const allTags = Array.from(new Set(portfolioItems.flatMap(i => i.tags))).sort();

  useEffect(() => {
    if (!isBooting) return;
    const interval = setInterval(() => {
      setBootProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsBooting(false), 800);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isBooting]);

  useEffect(() => {
    if (isLightTheme) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [isLightTheme]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX - 10);
      cursorY.set(e.clientY - 10);
    };
    
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [data-interactive="true"]')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  const filteredItems = activeFilter 
    ? portfolioItems.filter(item => item.tags.includes(activeFilter))
    : portfolioItems;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120 } }
  };



  return (
    <div className="min-h-screen text-almond selection:bg-tomato selection:text-bg-dark font-sans pb-24">
      {/* BOOT SCREEN */}
      <AnimatePresence>
        {isBooting && (
          <motion.div 
            className="fixed inset-0 z-[99999] bg-[#0c0c0d] cyberpunk-grid flex flex-col items-center justify-center font-mono p-4"
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)", transition: { duration: 0.6, ease: "easeOut" } }}
          >
            {/* Holographic scanning line */}
            <div className="scanline-effect"></div>

            <div className="w-full max-w-lg bg-black border-2 border-tomato p-6 relative overflow-hidden shadow-[0_0_50px_rgba(240,83,65,0.25)] rounded-none">
              
              {/* Cyberpunk corner brackets */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-rosy -translate-x-0.5 -translate-y-0.5"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-rosy translate-x-0.5 -translate-y-0.5"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-rosy -translate-x-0.5 translate-y-0.5"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-rosy translate-x-0.5 translate-y-0.5"></div>

              {/* Red warning bar */}
              <div className="bg-tomato text-black text-center font-extrabold text-xs tracking-[0.3em] py-1 mb-6 flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
                <span>WARNING: BREACH_PROTOCOL_ACTIVE</span>
              </div>

              {/* Heading */}
              <div className="text-center mb-6">
                <h1 className="text-tomato text-2xl md:text-3xl font-black uppercase tracking-wider cyber-glitch select-none">
                  {lang === 'pt' ? 'INVADINDO SISTEMAS...' : 'BREACHING SYSTEM...'}
                </h1>
                <p className="text-rosy text-xs font-bold mt-1 tracking-widest">
                  TARGET: SECURE_CORE_MINUS_OS_v1.0
                </p>
              </div>

              {/* Hacking Terminal Console */}
              <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-none font-mono text-xs text-almond/90 space-y-2.5 h-44 flex flex-col justify-end relative">
                {/* Tech background matrix effect */}
                <div className="absolute top-2 right-4 text-[9px] text-neutral-800 leading-none select-none text-right">
                  0x7A BC F0 11<br/>
                  0xDE AD BE EF<br/>
                  0xC0 FF EE 55<br/>
                  0x3F 88 AA 99
                </div>

                <div className="space-y-1.5 overflow-hidden">
                  <p className="text-neutral-500 text-[10px] tracking-widest">// DETECTED_PORTS: TCP/3000 {"->"} INJECTING EXPLOIT</p>
                  
                  {bootProgress > 15 && (
                    <motion.p initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="text-rosy">
                      <span className="text-tomato font-bold">▶</span> [STG_1] {t.boot.modules}
                    </motion.p>
                  )}
                  {bootProgress > 45 && (
                    <motion.p initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="text-rosy">
                      <span className="text-tomato font-bold">▶</span> [STG_2] {t.boot.engine}
                    </motion.p>
                  )}
                  {bootProgress > 75 && (
                    <motion.p initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="text-white">
                      <span className="text-tomato font-bold">▶</span> [STG_3] {t.boot.db}
                    </motion.p>
                  )}
                  {bootProgress >= 100 && (
                    <motion.p 
                      initial={{ scale: 0.95 }} 
                      animate={{ scale: [1, 1.02, 1] }} 
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="text-tomato font-bold border border-tomato p-1.5 text-center bg-tomato/10"
                    >
                      ★★★ {t.boot.online.toUpperCase()} ★★★
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Loader Slider */}
              <div className="mt-6 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-rosy font-bold">OVERWRITING ICE FIREWALL...</span>
                  <span className="text-tomato font-black text-sm">{bootProgress}%</span>
                </div>
                <div className="w-full h-3 bg-neutral-900 border border-tomato/30 p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-rosy to-tomato transition-all duration-100 ease-out flex items-center overflow-hidden" 
                    style={{ width: `${bootProgress}%` }}
                  >
                    {/* Retro lines pattern on progress bar */}
                    <div className="w-full h-full opacity-30" style={{ backgroundImage: 'linear-gradient(90deg, #000 50%, transparent 50%)', backgroundSize: '8px 100%' }} />
                  </div>
                </div>
              </div>

              {/* Decorative Coordinates */}
              <div className="mt-4 flex justify-between text-[9px] text-neutral-600 font-bold border-t border-neutral-900 pt-2">
                <span>SEC_SYS: INTRUDER_AUTHORIZED</span>
                <span>NODE_CONN: {Math.floor(bootProgress * 3.4)}.182 // LOCALHOST</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CUSTOM CURSOR */}
      <motion.div 
        className="fixed top-0 left-0 w-5 h-5 border-2 pointer-events-none z-[9999] mix-blend-exclusion flex items-center justify-center hidden md:flex"
        style={{ x: cursorX, y: cursorY }}
        animate={{
          borderColor: isHovering ? '#f05341' : '#dfc8b6',
          scale: isHovering ? 1.5 : 1,
          rotate: isHovering ? 45 : 0
        }}
        transition={{ type: 'tween', duration: 0.15 }}
      >
        {isHovering && <div className="w-1.5 h-1.5 bg-tomato rounded-full" />}
      </motion.div>

      {/* HEADER NAVBAR */}
      <header className="fixed top-0 w-full z-50 border-b border-rosy/20 bg-bg-dark/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between font-mono text-sm w-full">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="font-bold tracking-widest text-almond">{siteConfig.artist.name.toUpperCase()}_OS</span>
            </div>
            
            {/* Social Networks Tech Toolbar */}
            <div className="hidden lg:flex items-center gap-3 border-l border-rosy/20 pl-6 text-xs text-almond/60">
              {socialLinks.map(social => (
                <a key={social.id} href={social.href} target="_blank" rel="noreferrer" onClick={() => playClickSound()} className="hover:text-tomato transition-colors p-2 border border-transparent hover:border-tomato bg-surface-hover/20" data-interactive="true" title={social.title}>
                  <SocialIcon id={social.id} className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Compact Mobile Socials */}
            <div className="flex lg:hidden items-center gap-1 text-rosy border-r border-rosy/20 pr-3">
              {socialLinks.map(social => (
                <a key={social.id} href={social.href} target="_blank" rel="noreferrer" onClick={() => playClickSound()} className="hover:text-tomato p-2" data-interactive="true">
                  <SocialIcon id={social.id} className="w-4 h-4" />
                </a>
              ))}
            </div>

            <a href="#galeria" className="hidden sm:block hover:text-tomato transition-colors" data-interactive="true">{t.nav.gallery}</a>
            <a href="#fila" className="hidden sm:block hover:text-tomato transition-colors" data-interactive="true">{t.nav.queue}</a>
            <a href="#comissoes" className="hidden sm:block hover:text-tomato transition-colors" data-interactive="true">{t.nav.commissions}</a>
            
            <div className="flex items-center gap-2 bg-surface px-3 py-1 border border-rosy/30">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tomato opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-tomato"></span>
              </span>
              <span className="text-xs font-semibold text-rosy">{lang === 'pt' ? siteConfig.commissions.statusLabel_pt : siteConfig.commissions.statusLabel_en}</span>
            </div>

            <button 
              onClick={() => { playClickSound(); setLang(l => l === 'pt' ? 'en' : 'pt'); }}
              className="text-xs font-bold px-2 py-1 text-tomato border border-tomato/30 bg-surface hover:bg-surface-hover hover:border-tomato transition-colors"
              title="Toggle Language"
              data-interactive="true"
            >
              {lang === 'pt' ? 'PT-BR' : 'EN-UK'}
            </button>

            <button 
              onClick={() => { playClickSound(); setIsLightTheme(!isLightTheme); }}
              className="p-1.5 border border-rosy/30 bg-surface hover:bg-surface-hover hover:border-tomato transition-colors text-almond/80"
              title="Alternar Tema"
              data-interactive="true"
            >
              {isLightTheme ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="pt-32 max-w-7xl mx-auto px-4 md:px-8 space-y-32">
        {/* HERO SECTION */}
        <section className="relative">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="border-l-2 border-tomato pl-6 py-2"
          >
            <div className="font-mono text-rosy text-sm mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4" /> 
              <span>{t.hero.status}</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-almond mb-4 uppercase leading-[1.1]">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-tomato via-rosy to-brick">
                {siteConfig.artist.name}
              </span>
              {" "}{t.hero.title2}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-tomato via-rosy to-brick">
                {t.hero.title3}
              </span><br/>
              <span className="text-4xl md:text-5xl lg:text-6xl tracking-tight">{t.hero.title4}</span><br />
              {t.hero.title5}.<span className="animate-pulse text-tomato">_</span>
            </h1>
            
            <p className="max-w-xl text-lg text-almond/80 font-mono mt-6 mb-8">
              {lang === 'pt' ? siteConfig.artist.description_pt : siteConfig.artist.description_en}
            </p>

            <div className="flex flex-wrap gap-4 font-mono text-sm">
              <a href="#galeria" onClick={() => playClickSound()} className="flex items-center gap-2 bg-tomato text-bg-dark px-6 py-3 font-bold hover:bg-rosy transition-all relative group overflow-hidden">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"/>
                <span className="relative flex items-center gap-2">{t.hero.btnGallery} <ExternalLink className="w-4 h-4" /></span>
              </a>
              <a href="#comissoes" onClick={() => playClickSound()} className="flex items-center gap-2 border border-rosy text-almond px-6 py-3 hover:bg-surface transition-all">
                {t.hero.btnPrices} <Send className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
          
          {/* Decorative floating grids */}
          <div className="absolute top-0 right-0 -z-10 opacity-20 hidden lg:block">
            <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0H400V400H0V0Z" fill="url(#paint0_linear)"/>
              <defs>
                <linearGradient id="paint0_linear" x1="0" y1="0" x2="400" y2="400" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#F05341"/>
                  <stop offset="1" stopColor="#120C0B" stopOpacity="0"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </section>

        {/* ART GALLERY */}
        <section id="galeria" className="scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-rosy/30 pb-4 mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold uppercase tracking-tight flex items-center gap-3">
                <Palette className="text-rosy" />
                {t.gallery.title}
              </h2>
              <p className="font-mono text-sm text-almond/60 mt-2">{t.gallery.path}</p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="hidden md:block font-mono text-xs text-tomato border border-tomato px-2 py-1">
                [ {filteredItems.length} {t.gallery.files} ]
              </div>
              <div className="flex flex-wrap justify-end gap-2 font-mono text-xs">
                <button 
                  onClick={() => { playClickSound(); setActiveFilter(null); }}
                  className={`px-3 py-1 border transition-colors ${!activeFilter ? 'border-tomato bg-tomato/10 text-tomato' : 'border-rosy/30 text-almond/60 hover:border-rosy hover:text-almond'}`}
                >
                  {t.gallery.all}
                </button>
                {allTags.map(tag => (
                  <button 
                    key={tag}
                    onClick={() => { playClickSound(); setActiveFilter(tag); }}
                    className={`px-3 py-1 border transition-colors ${activeFilter === tag ? 'border-tomato bg-tomato/10 text-tomato' : 'border-rosy/30 text-almond/60 hover:border-rosy hover:text-almond'}`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  key={item.id} 
                  data-interactive="true"
                  className="group relative bg-surface border border-rosy/20 p-2 hover:border-tomato transition-colors cursor-pointer"
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => {
                    playOpenSound();
                    setSelectedImage(item);
                  }}
                >
                <div className="relative aspect-square overflow-hidden bg-bg-dark border border-surface-hover">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-all duration-500 scale-100 group-hover:scale-105"
                  />
                  
                  {/* Tech Overlay */}
                  <div className={`absolute inset-0 bg-rosy/15 transition-opacity duration-300 ${hoveredItem === item.id ? 'opacity-0' : 'opacity-100'}`} />
                  
                  {/* Corner crosshairs */}
                  <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-tomato opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-tomato opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-tomato opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-tomato opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <div className="mt-4 flex flex-col gap-2 font-mono text-xs pb-2">
                  <div className="flex justify-between text-almond">
                    <span className="font-semibold">{item.title}</span>
                    <span className="text-rosy">{item.id}</span>
                  </div>
                  <div className="flex gap-2">
                    {item.tags.map(tag => (
                      <span key={tag} className="bg-surface-hover px-1.5 py-0.5 text-almond/70">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* PUBLIC QUEUE / TRELLO-LIKE PROGRESS */}
        <section id="fila" className="border-t border-rosy/20 scroll-mt-24 bg-surface-hover/20">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 font-mono">
              <div>
                <h2 className="text-2xl font-bold uppercase tracking-widest text-almond">{t.queue.title}</h2>
                <p className="text-xs text-rosy mt-1.5">{t.queue.subtitle}</p>
              </div>
              <div className="text-xs border border-rosy/30 bg-surface-hover/30 px-3 py-1 text-almond/60 inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-tomato animate-pulse" />
                {t.queue.online}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
              {activeCommissions.map(comm => (
                <div key={comm.id} className="border border-rosy/30 bg-surface p-5 hover:border-tomato transition-colors group relative overflow-hidden backdrop-blur-sm">
                  <div className="absolute inset-0 bg-rosy/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex justify-between items-start mb-4 text-xs">
                    <span className="text-tomato font-bold tracking-widest">{comm.id}</span>
                    <span className="text-almond/50 truncate max-w-[120px]" title={comm.client}>{t.queue.client}: {comm.client}</span>
                  </div>

                  <div className="flex items-center gap-2 text-almond mb-6">
                    <span className="text-rosy">{comm.icon}</span>
                    <span className="text-sm font-semibold truncate">{comm.type}</span>
                  </div>

                  <div className="space-y-2 relative z-10">
                    <div className="flex justify-between text-xs">
                      <span className="text-rosy">{t.queue.status}: <span className="text-almond font-semibold">{comm.status}</span></span>
                      <span className="text-tomato font-bold">{comm.progress}%</span>
                    </div>
                    
                    {/* Progress Bar Container */}
                    <div className="w-full h-1.5 bg-bg-dark border border-rosy/20 overflow-hidden relative">
                      {/* Bar fill */}
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${comm.progress}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                        className="absolute left-0 top-0 bottom-0 bg-tomato"
                      />
                    </div>
                    <div className="text-[10px] text-almond/40 text-right mt-1">
                      {comm.stage}
                    </div>
                  </div>
                  
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMMISSIONS INFO */}
        <section id="comissoes" className="scroll-mt-24">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="border border-rosy/30 bg-surface/50 backdrop-blur-sm relative shadow-2xl"
          >
            {/* Terminal Window Header */}
            <div className="flex items-center gap-2 border-b border-rosy/30 bg-surface-hover px-4 py-2 font-mono text-xs">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-brick/80"></div>
                <div className="w-3 h-3 rounded-full bg-almond/50"></div>
                <div className="w-3 h-3 rounded-full bg-tomato"></div>
              </div>
              <span className="text-almond/60 ml-2">{t.commissions.path}</span>
            </div>
            
            <div className="p-6 md:p-10">
              <div className="mb-10 text-center space-y-4">
                <h2 className="text-3xl font-bold uppercase tracking-tight text-almond">{t.commissions.title}</h2>
                <p className="font-mono text-sm text-rosy">{t.commissions.subtitle}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-mono text-sm">
                {commissionTiers.map((tier) => (
                  <div key={tier.id} className="border border-dashed border-rosy/40 hover:border-tomato bg-surface p-6 transition-colors flex flex-col h-full relative group">
                    <div className="absolute inset-0 bg-rosy/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="text-rosy mb-4">{tier.icon}</div>
                    <div className="text-xs text-almond/50 mb-1">[{tier.id}]</div>
                    <h3 className="text-lg font-bold text-tomato mb-2 border-b border-dashed border-rosy/20 pb-2">
                      {tier.name}
                    </h3>
                    
                    <div className="text-2xl text-almond font-bold mb-6">
                      {tier.price} <span className="text-xs text-almond/50 font-normal">{t.commissions.base}</span>
                    </div>
                    
                    <ul className="space-y-3 mb-8">
                      {tier.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-almond/80">
                          <span className="text-brick mt-0.5">{">"}</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {(tier as any).hasCheckboxes ? (
                      <div className="mt-auto mb-6 space-y-2 border-t border-rosy/20 pt-4">
                        <button 
                          onClick={() => { playClickSound(); setRefSheetLevel(prev => prev === 'media' ? 'base' : 'media'); }}
                          className={`w-full text-left px-3 py-2 border transition-colors text-sm ${refSheetLevel === 'media' ? 'border-tomato bg-tomato/10 text-tomato font-bold' : 'border-rosy/30 text-almond/80 hover:border-rosy hover:text-almond'}`}
                        >
                          {lang === 'pt' ? 'Ref sheet média' : 'Medium Ref Sheet'}
                        </button>
                        <button 
                          onClick={() => { playClickSound(); setRefSheetLevel(prev => prev === 'avancada' ? 'base' : 'avancada'); }}
                          className={`w-full text-left px-3 py-2 border transition-colors text-sm ${refSheetLevel === 'avancada' ? 'border-tomato bg-tomato/10 text-tomato font-bold' : 'border-rosy/30 text-almond/80 hover:border-rosy hover:text-almond'}`}
                        >
                          {lang === 'pt' ? 'Ref sheet avançada' : 'Advanced Ref Sheet'}
                        </button>
                        <button 
                          onClick={() => { playClickSound(); setRefSheetLevel(prev => prev === 'complexa' ? 'base' : 'complexa'); }}
                          className={`w-full text-left px-3 py-2 border transition-colors text-sm ${refSheetLevel === 'complexa' ? 'border-tomato bg-tomato/10 text-tomato font-bold' : 'border-rosy/30 text-almond/80 hover:border-rosy hover:text-almond'}`}
                        >
                          {lang === 'pt' ? 'Ref sheet complexa' : 'Complex Ref Sheet'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1" />
                    )}
                    
                    <button onClick={() => playClickSound()} className="w-full border border-rosy text-almond hover:bg-rosy hover:text-bg-dark py-2 font-bold transition-colors">
                      {t.commissions.selectMode}
                    </button>
                    
                    <div className="mt-4 text-xs text-almond/60 space-y-1.5">
                      {pricingExtras.map((extra, idx) => (
                        <div key={idx} className="flex gap-1.5 leading-snug">
                          <span className="text-brick flex-shrink-0 mt-0.5">*</span> <span>{extra}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* TOS Block */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-12 border-l-4 border-brick bg-surface-hover p-6 font-mono text-xs md:text-sm"
              >
                <div className="flex gap-2 items-center text-tomato font-bold mb-3 text-base">
                  <AlertTriangle className="w-5 h-5" /> {t.commissions.tosTitle}
                </div>
                <div className="text-almond/80 space-y-2">
                  {siteConfig.tos.map((rule, idx) => (
                    <p key={idx}>{rule}</p>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* STATS SECTION */}
        <section className="py-12 border-y border-rosy/20 bg-surface-hover/30">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center font-mono">
            <div className="space-y-2">
              <div className="text-4xl lg:text-5xl font-bold text-tomato">
                <AnimatedCounter value={siteConfig.stats.projects} />+
              </div>
              <div className="text-xs text-almond/60 tracking-widest uppercase">{t.stats.projects}</div>
            </div>
            <div className="space-y-2 border-y md:border-y-0 md:border-x border-rosy/20 py-8 md:py-0">
              <div className="text-4xl lg:text-5xl font-bold text-tomato">
                <AnimatedCounter value={siteConfig.stats.retention} />%
              </div>
              <div className="text-xs text-almond/60 tracking-widest uppercase">{t.stats.retention}</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl lg:text-5xl font-bold text-tomato">
                <AnimatedCounter value={siteConfig.stats.pixels} />M+
              </div>
              <div className="text-xs text-almond/60 tracking-widest uppercase">{t.stats.pixels}</div>
            </div>
          </div>
        </section>


      </main>

      <PacmanGame />
      <TurntablePlayer lang={lang} />

      {/* FOOTER */}
      <footer className="border-t border-rosy/20 bg-surface text-center py-10 font-mono text-sm text-almond/60">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-4">
          <p>{siteConfig.artist.name.toUpperCase()}_OS V.1.0 © 2026</p>
          <div className="flex gap-4 mt-2 text-rosy">
            {socialLinks.map(social => (
              <a key={social.id} href={social.href} target="_blank" rel="noreferrer" className="p-2 hover:text-tomato hover:bg-surface-hover/20 transition-all border border-transparent hover:border-tomato rounded-full" title={social.title}>
                <SocialIcon id={social.id} className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
      </footer>

      {/* LIGHTBOX MODAL */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-bg-dark/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 lg:p-12 cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 lg:top-10 lg:right-10 text-rosy hover:text-tomato font-mono text-xs md:text-sm border border-rosy/50 hover:border-tomato px-4 py-2 bg-surface backdrop-blur-sm z-10 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              playClickSound();
              setSelectedImage(null);
            }}
          >
            {t.modal.close}
          </button>
          
          <div 
            className="relative w-full max-w-5xl max-h-[80vh] flex items-center justify-center cursor-default bg-surface border border-rosy/20 p-2 shadow-[0_0_50px_rgba(240,83,65,0.05)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tech Corner Accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-tomato -translate-x-1 -translate-y-1"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-tomato translate-x-1 -translate-y-1"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-tomato -translate-x-1 translate-y-1"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-tomato translate-x-1 translate-y-1"></div>
            
            <img 
              src={selectedImage.image} 
              alt={selectedImage.title}
              className="max-width-full max-h-[75vh] object-contain border border-surface-hover"
            />
          </div>
          
          <div className="mt-8 text-center font-mono">
            <span className="bg-surface px-6 py-3 border border-rosy/40 text-almond shadow-xl flex items-center gap-3">
              <span className="text-tomato font-bold">{selectedImage.id}</span> 
              <span className="text-rosy/40">|</span> 
              <span>{selectedImage.title}</span>
            </span>
            <div className="flex justify-center gap-2 mt-4">
               {selectedImage.tags.map(tag => (
                 <span key={tag} className="text-xs text-rosy bg-surface-hover px-2 py-1 border border-rosy/20">
                   #{tag}
                 </span>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
