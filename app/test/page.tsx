import Prism from "@/components/Prism";

export default function Test() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div style={{ width: '100%', height: '600px', position: 'relative' }}>
        <Prism
          animationType="rotate"
          timeScale={0.5}
          height={3.5}
          baseWidth={5.5}
          scale={3.6}
          hueShift={0}
          colorFrequency={1}
          noise={0}
          glow={1}
          bloom={1}
        />
      </div>
    </div>
  );
}