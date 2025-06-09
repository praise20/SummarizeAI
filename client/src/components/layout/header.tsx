import { Button } from "@/components/ui/button";
import { Brain, Menu } from "lucide-react";

interface HeaderProps {
  onMenuClick?: () => void;
  showMenu?: boolean;
}

export function Header({ onMenuClick, showMenu = false }: HeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2">
            {showMenu && (
              <Button variant="ghost" size="sm" onClick={onMenuClick} className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">SummarizeAI</span>
          </div>
        </div>
      </div>
    </header>
  );
}
