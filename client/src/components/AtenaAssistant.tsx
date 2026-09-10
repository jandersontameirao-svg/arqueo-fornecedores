import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Sparkles, Send, Mic, MicOff, Volume2, VolumeX, X, AlertTriangle, Loader2 } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

// Hook de reconhecimento de voz (Web Speech API — nativo do navegador, pt-BR).
// Quando o modelo de voz "Astra" for vinculado, este é o ponto de troca.
function useSpeech() {
  const recRef = useRef<any>(null);
  const supported = typeof window !== "undefined" && (("SpeechRecognition" in window) || ("webkitSpeechRecognition" in window));
  const start = (onResult: (t: string) => void, onEnd: () => void) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "pt-BR";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => onResult(e.results[0][0].transcript);
    rec.onend = onEnd;
    rec.onerror = onEnd;
    recRef.current = rec;
    rec.start();
  };
  const stop = () => { try { recRef.current?.stop(); } catch {} };
  return { supported, start, stop };
}

export default function AtenaAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [listening, setListening] = useState(false);
  const [voiceOut, setVoiceOut] = useState(false);
  const speech = useSpeech();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: inconsistencies } = trpc.atena.inconsistencies.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000, staleTime: 60 * 1000,
  });

  const chat = trpc.atena.chat.useMutation({
    onSuccess: (res) => {
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
      if (voiceOut) speak(res.reply);
    },
    onError: (e) => setMessages((m) => [...m, { role: "assistant", content: `Erro: ${e.message}` }]),
  });

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages, chat.isPending]);

  const speak = (text: string) => {
    try {
      window.speechSynthesis?.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "pt-BR";
      window.speechSynthesis?.speak(u);
    } catch {}
  };

  const send = (text: string) => {
    const content = text.trim();
    if (!content || chat.isPending) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    chat.mutate({ messages: next });
  };

  const toggleMic = () => {
    if (listening) { speech.stop(); setListening(false); return; }
    if (!speech.supported) return;
    setListening(true);
    speech.start((t) => { setListening(false); send(t); }, () => setListening(false));
  };

  const critCount = (inconsistencies ?? []).filter((i) => i.severity === "critical" || i.severity === "high").length;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 text-white px-4 py-3 shadow-xl hover:scale-105 transition-transform"
        title="Atena — assistente de IA"
      >
        <Sparkles className="h-5 w-5" />
        <span className="font-semibold text-sm">Atena</span>
        {critCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[11px] font-bold flex items-center justify-center">{critCount}</span>
        )}
      </button>
    );
  }

  return (
    <Card className="fixed bottom-5 right-5 z-50 w-[min(420px,calc(100vw-2rem))] h-[min(600px,calc(100vh-2rem))] flex flex-col shadow-2xl overflow-hidden p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <div>
            <p className="font-semibold leading-tight">Atena</p>
            <p className="text-[11px] opacity-80 leading-tight">Assistente de IA · consciência total do site</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setVoiceOut((v) => !v)} title={voiceOut ? "Voz ligada" : "Voz desligada"} className="p-1.5 rounded hover:bg-white/20">
            {voiceOut ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded hover:bg-white/20"><X className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Inconsistências */}
      {inconsistencies && inconsistencies.length > 0 && (
        <div className="px-3 py-2 bg-amber-50 border-b text-xs space-y-1 max-h-24 overflow-y-auto">
          <div className="flex items-center gap-1 font-semibold text-amber-800"><AlertTriangle className="h-3.5 w-3.5" /> {inconsistencies.length} inconsistência(s)</div>
          {inconsistencies.slice(0, 3).map((i, n) => (
            <p key={n} className="text-amber-700">• [{i.severity}] {i.detail}</p>
          ))}
        </div>
      )}

      {/* Mensagens */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground text-center mt-8 space-y-2">
            <Sparkles className="h-8 w-8 mx-auto text-indigo-400" />
            <p>Olá! Sou a <b>Atena</b>. Sei tudo que acontece no sistema — quem mudou o quê e quando.</p>
            <p className="text-xs">Experimente: "Quais são os principais problemas hoje?" ou "Recalcule o risco do fornecedor X".</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-indigo-600 text-white" : "bg-muted"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {chat.isPending && (
          <div className="flex justify-start"><div className="bg-muted rounded-2xl px-3 py-2"><Loader2 className="h-4 w-4 animate-spin" /></div></div>
        )}
      </div>

      {/* Input */}
      <div className="p-2 border-t flex items-center gap-1">
        {speech.supported && (
          <Button variant={listening ? "default" : "ghost"} size="icon" onClick={toggleMic} title="Falar">
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        )}
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
          placeholder={listening ? "Ouvindo..." : "Pergunte algo à Atena..."}
          disabled={chat.isPending}
        />
        <Button size="icon" onClick={() => send(input)} disabled={chat.isPending || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
