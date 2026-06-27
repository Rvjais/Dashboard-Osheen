const fs = require('fs');
const path = './client/src/components/sections/TrackerSection.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Filtered tracker
content = content.replace(/const filteredTracker = useMemo\(\(\) => \{[\s\S]*?\}, \[tracker, columnFilters\]\);/, `const filteredTracker = useMemo(() => {
    return tracker.filter(item => {
      return Object.entries(columnFilters).every(([col, val]) => {
        if (!val) return true;
        switch (col) {
          case 'name': return (item.name || '').toLowerCase().includes(val.toLowerCase());
          case 'status': return item.status === val;
          case 'assignee': return item.assigneeId === val;
          case 'dueDate': return item.date === val;
          default: return true;
        }
      });
    });
  }, [tracker, columnFilters]);`);

// 2. Column order logic
content = content.replace(/const required = \['checkbox', 'name', 'type', 'priority', 'status', 'deliverable', 'assignee', 'links', 'actions'\];/, `const required = ['checkbox', 'name', 'status', 'dueDate', 'progress', 'assignee', 'actions'];`);
content = content.replace(/return \[\n\s+'checkbox',\n\s+'name',\n\s+'type',\n\s+'priority',\n\s+'status',\n\s+'deliverable',\n\s+'assignee',\n\s+'links',\n\s+'actions'\n\s+\];/, `return [
      'checkbox',
      'name',
      'status',
      'dueDate',
      'progress',
      'assignee',
      'actions'
    ];`);

// 3. Status styling in TH and TD
// To make it look clean with dots
content = content.replace(/item\.status === TaskStatus\.DONE \? 'bg-emerald-100 text-emerald-600' :[\s\S]*?'bg-gray-100 text-gray-500'/g, `
                                  item.status === TaskStatus.DONE ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  item.status === TaskStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-700 border border-blue-200' : 
                                  item.status === TaskStatus.BLOCKED ? 'bg-red-50 text-red-700 border border-red-200' :
                                  item.status === TaskStatus.IN_REVIEW ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                  'bg-gray-50 text-gray-700 border border-gray-200'`);

content = content.replace(/<select\n\s+className=\{cn\("px-2 py-1 rounded text-\[10px\] font-bold uppercase focus:outline-none",/g, `<select
                                className={cn("px-3 py-1.5 rounded-full text-xs font-bold focus:outline-none shadow-sm cursor-pointer",`);

// 4. Update the table THs
// I will replace `case 'type':` to end of `case 'priority':` with dueDate and progress headers
const thReplace = `case 'dueDate':
                        return (
                          <th 
                            key="dueDate" 
                            draggable 
                            onDragStart={(e) => handleDragStart(e, 'dueDate')}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, 'dueDate')}
                            className={cn(
                              "px-6 py-4 cursor-grab active:cursor-grabbing hover:bg-gray-100 transition-colors select-none relative",
                              draggedCol === 'dueDate' && "opacity-50 border-2 border-dashed border-brand-accent"
                            )}
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <GripVertical size={14} className="text-gray-400 shrink-0" />
                                <span>Due Date</span>
                              </div>
                              <button onClick={() => setActiveFilterCol(activeFilterCol === 'dueDate' ? null : 'dueDate')} className={cn("p-1 rounded hover:bg-gray-200", columnFilters['dueDate'] && "text-brand-accent")}>
                                <Filter size={14} />
                              </button>
                            </div>
                            {activeFilterCol === 'dueDate' && (
                              <div 
                                className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg rounded p-2 z-10 min-w-[150px] font-normal cursor-default" 
                                onClick={e => e.stopPropagation()}
                                draggable={true}
                                onDragStart={e => { e.preventDefault(); e.stopPropagation(); }}
                              >
                                <input
                                  type="date"
                                  className="w-full text-sm p-1.5 border border-gray-200 rounded outline-none focus:border-brand-accent"
                                  value={columnFilters['dueDate'] || ''}
                                  onChange={(e) => setColumnFilters({ ...columnFilters, dueDate: e.target.value })}
                                />
                              </div>
                            )}
                          </th>
                        );
                      case 'progress':
                        return (
                          <th 
                            key="progress" 
                            draggable 
                            onDragStart={(e) => handleDragStart(e, 'progress')}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, 'progress')}
                            className={cn(
                              "px-6 py-4 cursor-grab active:cursor-grabbing hover:bg-gray-100 transition-colors select-none",
                              draggedCol === 'progress' && "opacity-50 border-2 border-dashed border-brand-accent"
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              <GripVertical size={14} className="text-gray-400 shrink-0" />
                              <span>Progress</span>
                            </div>
                          </th>
                        );`;

const thRegex = /case 'type':[\s\S]*?case 'priority':[\s\S]*?(?=case 'status':)/;
content = content.replace(thRegex, thReplace);

// Remove deliverable and links THs
const deliverableThRegex = /case 'deliverable':[\s\S]*?(?=case 'assignee':)/;
content = content.replace(deliverableThRegex, '');

const linksThRegex = /case 'links':[\s\S]*?(?=case 'actions':)/;
content = content.replace(linksThRegex, '');

// 5. Update the table TDs
const tdReplace = `case 'dueDate':
                          return (
                            <td key="dueDate" className="px-6 py-4">
                              <input
                                type="date"
                                className="bg-transparent focus:outline-none focus:bg-white focus:ring-1 ring-gray-200 px-2 py-1 rounded text-sm text-gray-600"
                                value={item.date}
                                onChange={(e) => setTracker(tracker.map(t => t.id === item.id ? { ...t, date: e.target.value } : t))}
                              />
                            </td>
                          );
                        case 'progress':
                          return (
                            <td key="progress" className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: \`\${item.progress || 0}%\` }} />
                                </div>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  className="w-12 bg-transparent text-sm text-gray-500 focus:outline-none focus:bg-white focus:ring-1 ring-gray-200 px-1 rounded text-right"
                                  value={item.progress || 0}
                                  onChange={(e) => setTracker(tracker.map(t => t.id === item.id ? { ...t, progress: parseInt(e.target.value) || 0 } : t))}
                                />
                                <span className="text-sm text-gray-500">%</span>
                              </div>
                            </td>
                          );`;

const tdRegex = /case 'type':[\s\S]*?case 'priority':[\s\S]*?(?=case 'status':)/;
content = content.replace(tdRegex, tdReplace);

// Remove deliverable and links TDs
const deliverableTdRegex = /case 'deliverable':[\s\S]*?(?=case 'assignee':)/;
content = content.replace(deliverableTdRegex, '');

const linksTdRegex = /case 'links':[\s\S]*?(?=case 'actions':)/;
content = content.replace(linksTdRegex, '');

// 6. Update general padding and font for TH and TD
content = content.replace(/px-4 py-3/g, 'px-6 py-4 text-sm');

// 7. Update status to use dot 
content = content.replace(/>\{v.replace\('_', ' '\)\}<\/option>/g, `>
                                    {v === TaskStatus.DONE ? '🟢 ' : 
                                     v === TaskStatus.IN_PROGRESS ? '🔵 ' : 
                                     v === TaskStatus.BLOCKED ? '🔴 ' : 
                                     v === TaskStatus.IN_REVIEW ? '🟡 ' : '⚪ '}
                                    {v.replace('_', ' ')}
                                  </option>`);

// Write back
fs.writeFileSync(path, content, 'utf8');
console.log('TrackerSection updated successfully');
