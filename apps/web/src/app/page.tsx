import { BoardView } from '@/components/board/BoardView';
import { Header } from '@/components/layout/Header';

export default function BoardPage() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-1 overflow-hidden">
        <BoardView />
      </main>
    </div>
  );
}
