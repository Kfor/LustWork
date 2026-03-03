import Header from "../components/Header";
import WorkTimer from "../components/WorkTimer";
import RewardPanel from "../components/RewardPanel";
import TaskList from "../components/TaskList";
import RatingsPanel from "../components/RatingsPanel";
import NotesSection from "../components/NotesSection";

export default function TodayPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <WorkTimer />
        <RewardPanel />
        <TaskList />
        <RatingsPanel />
        <NotesSection />
      </main>
    </div>
  );
}
