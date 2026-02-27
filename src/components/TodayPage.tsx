import Header from './Header';
import WorkTimer from './WorkTimer';
import RewardPanel from './RewardPanel';
import TaskList from './TaskList';
import RatingsPanel from './RatingsPanel';
import NotesSection from './NotesSection';

export default function TodayPage() {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 overflow-y-auto">
        <WorkTimer />
        <RewardPanel />
        <TaskList />
        <RatingsPanel />
        <NotesSection />
      </div>
    </div>
  );
}
