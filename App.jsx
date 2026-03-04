import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Circle, 
  BookOpen,
  Settings,
  LogOut,
  ArrowRight,
  PlayCircle,
  Clock,
  Download,
  ShieldCheck,
  Zap,
  LockIcon,
  Globe,
  Save,
  Plus,
  Trash2,
  FileText,
  Type
} from 'lucide-react';

/**
 * NEXTLABS MINIMAL BRANDED LMS
 * Primary Blue: #004990 | Primary Orange: #F47920 | Dark Grey: #414042
 */

const INITIAL_COURSES = [
  {
    id: "zero-trust-foundations",
    title: "Zero Trust Data-Centric Security",
    tagline: "Protect data anytime and anywhere with NextLabs",
    description: "Learn how NextLabs provides zero trust data-centric security software and services to protect data across applications, databases, and files.",
    duration: "2 hours",
    thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800",
    sections: [
      {
        title: "Introduction",
        lessons: [
          { id: "zt-1", title: "The NextLabs Vision", content: "# The NextLabs Vision\nProtecting data anytime and anywhere.\n\nhttps://youtu.be/dQw4w9WgXcQ" },
          { id: "zt-2", title: "Dynamic Authorization", content: "# Technology Overview\nOur patented dynamic authorization technology and industry leading attribute-based zero trust policy platform." }
        ]
      }
    ]
  }
];

export default function App() {
  const [view, setView] = useState('landing'); // landing, details, login, viewer, editor
  const [courses, setCourses] = useState(() => {
    const saved = localStorage.getItem('nl_courses');
    return saved ? JSON.parse(saved) : INITIAL_COURSES;
  });
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('lms_user')));
  const [completedLessons, setCompletedLessons] = useState(() => JSON.parse(localStorage.getItem('lms_progress')) || []);
  const [activeLessonId, setActiveLessonId] = useState(null);

  useEffect(() => {
    localStorage.setItem('nl_courses', JSON.stringify(courses));
  }, [courses]);

  const handleCourseUpdate = (updatedCourse) => {
    const newCourses = courses.map(c => c.id === updatedCourse.id ? updatedCourse : c);
    setCourses(newCourses);
    setSelectedCourse(updatedCourse);
    setView('details');
  };

  const handleLogin = (email) => {
    const newUser = { email, role: 'admin', name: email.split('@')[0] };
    setUser(newUser);
    localStorage.setItem('lms_user', JSON.stringify(newUser));
    setView('landing');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('lms_user');
    setView('landing');
  };

  return (
    <div className="min-h-screen bg-white text-[#414042] font-['Open_Sans',sans-serif] antialiased">
      {/* MINIMAL HEADER */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-white border-b-2 border-slate-100">
        <button onClick={() => setView('landing')} className="flex items-center gap-2">
          <div className="bg-[#004990] text-white px-2 py-1 font-bold text-xs">NEXTLABS</div>
          <span className="font-bold tracking-tight text-lg text-[#004990]">ACADEMY</span>
        </button>
        
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Admin: {user.name}</span>
              <button onClick={handleLogout} className="text-xs font-bold uppercase hover:text-[#004990] transition-colors flex items-center gap-1">
                <LogOut size={14} /> Logout
              </button>
            </div>
          ) : (
            <button onClick={() => setView('login')} className="bg-[#004990] text-white px-4 py-2 text-xs font-bold uppercase tracking-widest">Portal Login</button>
          )}
        </div>
      </header>

      <main>
        {view === 'landing' && <LandingPage courses={courses} onSelect={(c) => { setSelectedCourse(c); setView('details'); }} />}
        {view === 'details' && (
          <CourseDetails 
            course={selectedCourse} 
            user={user}
            onStart={() => {
              if(!user) return setView('login');
              setActiveLessonId(selectedCourse.sections[0]?.lessons[0]?.id);
              setView('viewer');
            }} 
            onEdit={() => setView('editor')}
            onBack={() => setView('landing')} 
          />
        )}
        {view === 'login' && <LoginPage onLogin={handleLogin} />}
        {view === 'viewer' && (
            <CourseViewer 
                courseData={selectedCourse} 
                activeLessonId={activeLessonId}
                setActiveLessonId={setActiveLessonId}
                completedLessons={completedLessons}
                setCompletedLessons={(val) => {
                  setCompletedLessons(val);
                  localStorage.setItem('lms_progress', JSON.stringify(val));
                }}
            />
        )}
        {view === 'editor' && (
          <CourseEditor 
            course={selectedCourse} 
            onSave={handleCourseUpdate} 
            onCancel={() => setView('details')} 
          />
        )}
      </main>
    </div>
  );
}

/** --- LANDING PAGE --- */
function LandingPage({ courses, onSelect }) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-extrabold text-[#004990] mb-2">Training Catalog</h1>
      <p className="text-slate-500 mb-10 text-sm uppercase tracking-[0.2em] font-bold">Zero Trust Data-Centric Security Curriculum</p>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-l border-slate-200">
        {courses.map((course) => (
          <button 
            key={course.id}
            onClick={() => onSelect(course)}
            className="group flex flex-col bg-white border-r border-b border-slate-200 p-8 text-left hover:bg-slate-50 transition-all"
          >
            <div className="aspect-video bg-slate-100 mb-6 relative border border-slate-200">
                <img src={course.thumbnail} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                <div className="absolute top-0 left-0 bg-[#004990] text-white px-2 py-1 text-[9px] font-bold uppercase">Certified</div>
            </div>
            <h3 className="text-xl font-bold mb-2 text-[#004990] group-hover:text-[#F47920] transition-colors">{course.title}</h3>
            <p className="text-slate-500 text-sm mb-6 line-clamp-2">{course.tagline}</p>
            <div className="mt-auto flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>{course.duration}</span>
                <ArrowRight size={16} className="text-[#004990]" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/** --- COURSE DETAILS --- */
function CourseDetails({ course, onStart, onEdit, onBack, user }) {
  if (!course) return null;
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="flex-1">
          <button onClick={onBack} className="text-[10px] font-bold text-[#004990] mb-6 flex items-center gap-1 uppercase tracking-widest">
            <ChevronLeft size={14}/> Back to Catalog
          </button>
          <h1 className="text-4xl font-extrabold text-[#004990] mb-6">{course.title}</h1>
          <p className="text-lg text-slate-600 mb-8 border-l-4 border-[#F47920] pl-6 leading-relaxed">{course.description}</p>
          
          <div className="flex gap-4">
            <button onClick={onStart} className="bg-[#004990] text-white px-8 py-4 font-bold uppercase tracking-widest text-sm hover:bg-[#00366b] transition-all">Launch Course</button>
            {user?.role === 'admin' && (
              <button onClick={onEdit} className="border-2 border-[#004990] text-[#004990] px-8 py-4 font-bold uppercase tracking-widest text-sm hover:bg-slate-50">Edit Course</button>
            )}
          </div>
        </div>
        <div className="w-full lg:w-80 shrink-0">
          <div className="border-t-4 border-[#F47920] bg-slate-50 p-6 border border-slate-200">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Module List</h4>
            <div className="space-y-3">
              {course.sections.map((s, i) => (
                <div key={i} className="text-sm font-bold text-[#004990] flex items-center gap-2">
                  <ShieldCheck size={14}/> {s.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** --- LOGIN PAGE --- */
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <div className="w-full max-w-sm p-10 border-2 border-slate-200">
        <div className="bg-[#004990] text-white inline-block px-3 py-1 text-[10px] font-bold uppercase mb-4">Secure Access</div>
        <h2 className="text-2xl font-bold mb-6 text-[#414042]">Portal Login</h2>
        <form onSubmit={(e) => { e.preventDefault(); onLogin(email); }}>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Corporate Email</label>
          <input 
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            className="w-full p-3 border border-slate-200 mb-6 focus:border-[#004990] outline-none font-bold"
          />
          <button className="w-full bg-[#004990] text-white py-4 font-bold uppercase tracking-widest hover:bg-[#00366b]">Authorize</button>
        </form>
      </div>
    </div>
  );
}

/** --- COURSE VIEWER --- */
function CourseViewer({ courseData, activeLessonId, setActiveLessonId, completedLessons, setCompletedLessons }) {
  const allLessons = useMemo(() => courseData.sections.flatMap(s => s.lessons), [courseData]);
  const activeLesson = allLessons.find(l => l.id === activeLessonId) || allLessons[0];
  const currentIndex = allLessons.findIndex(l => l.id === activeLesson?.id);

  const extractYTId = (url) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const renderContent = (content) => {
    return content.split('\n').map((line, i) => {
      const vidId = extractYTId(line.trim());
      if (vidId) return (
        <div key={i} className="my-8 aspect-video border-4 border-black">
          <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${vidId}`} frameBorder="0" allowFullScreen></iframe>
        </div>
      );
      if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold text-[#004990] mt-10 mb-6">{line.replace('# ', '')}</h1>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-[#414042] mt-8 mb-4 border-l-4 border-[#F47920] pl-4">{line.replace('## ', '')}</h2>;
      return line.trim() === "" ? <br key={i}/> : <p key={i} className="mb-4 text-slate-600 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="flex h-[calc(100vh-53px)]">
      <aside className="w-72 bg-slate-50 border-r border-slate-200 overflow-y-auto p-6">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#F47920] mb-6">Course Modules</h3>
        {courseData.sections.map((sec, sIdx) => (
          <div key={sIdx} className="mb-8">
            <div className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-tighter">{sec.title}</div>
            <div className="space-y-1">
              {sec.lessons.map(les => (
                <button 
                  key={les.id} onClick={() => setActiveLessonId(les.id)}
                  className={`w-full text-left p-3 text-xs font-bold transition-all ${activeLessonId === les.id ? 'bg-[#004990] text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                  <div className="flex items-center gap-2">
                    {completedLessons.includes(les.id) ? <CheckCircle2 size={12}/> : <Circle size={12}/>}
                    <span className="truncate">{les.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </aside>
      
      <main className="flex-1 overflow-y-auto p-12 relative bg-white">
        <div className="max-w-3xl mx-auto pb-32">
          {activeLesson && (
            <>
              <div className="mb-12">
                <span className="text-[10px] font-bold text-[#F47920] uppercase tracking-[0.2em]">{currentIndex + 1} / {allLessons.length} Modules</span>
                <h2 className="text-5xl font-extrabold text-[#004990] mt-2">{activeLesson.title}</h2>
              </div>
              {renderContent(activeLesson.content)}
              <div className="mt-16 flex gap-4 border-t border-slate-100 pt-8">
                <button 
                  onClick={() => {
                    const next = completedLessons.includes(activeLesson.id) ? completedLessons.filter(id => id !== activeLesson.id) : [...completedLessons, activeLesson.id];
                    setCompletedLessons(next);
                  }}
                  className={`flex-1 py-4 font-bold uppercase tracking-widest text-xs border-2 ${completedLessons.includes(activeLesson.id) ? 'bg-green-50 border-green-200 text-green-700' : 'bg-black text-white border-black'}`}
                >
                  {completedLessons.includes(activeLesson.id) ? 'Verified' : 'Complete Module'}
                </button>
              </div>
            </>
          )}
        </div>
        
        {/* PLAYER NAV */}
        <div className="fixed bottom-6 right-12 flex gap-1 shadow-2xl">
          <button 
            disabled={currentIndex <= 0}
            onClick={() => setActiveLessonId(allLessons[currentIndex - 1].id)}
            className="p-4 bg-[#414042] text-white disabled:opacity-30 border-r border-white/10"
          ><ChevronLeft size={24}/></button>
          <button 
            disabled={currentIndex >= allLessons.length - 1}
            onClick={() => setActiveLessonId(allLessons[currentIndex + 1].id)}
            className="p-4 bg-[#414042] text-white disabled:opacity-30"
          ><ChevronRight size={24}/></button>
        </div>
      </main>
    </div>
  );
}

/** --- COURSE EDITOR --- */
function CourseEditor({ course, onSave, onCancel }) {
  const [formData, setFormData] = useState(JSON.parse(JSON.stringify(course)));
  const [activeTab, setActiveTab] = useState('general'); // general, content
  const [editingLessonId, setEditingLessonId] = useState(null);

  const currentLesson = useMemo(() => {
    for (let section of formData.sections) {
      const found = section.lessons.find(l => l.id === editingLessonId);
      if (found) return found;
    }
    return null;
  }, [editingLessonId, formData]);

  const updateLessonContent = (id, newContent) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(sec => ({
        ...sec,
        lessons: sec.lessons.map(les => les.id === id ? { ...les, content: newContent } : les)
      }))
    }));
  };

  const addLesson = (sectionIndex) => {
    const newId = `lesson-${Date.now()}`;
    const newLesson = { id: newId, title: "New Module", content: "# New Module Content" };
    const newSections = [...formData.sections];
    newSections[sectionIndex].lessons.push(newLesson);
    setFormData({ ...formData, sections: newSections });
    setEditingLessonId(newId);
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-53px)] flex flex-col">
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <h2 className="text-lg font-bold text-[#004990]">Editing: {course.title}</h2>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('general')} className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 ${activeTab === 'general' ? 'bg-[#004990] text-white' : 'text-slate-400'}`}>Settings</button>
            <button onClick={() => setActiveTab('content')} className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 ${activeTab === 'content' ? 'bg-[#004990] text-white' : 'text-slate-400'}`}>Curriculum</button>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-black">Cancel</button>
          <button onClick={() => onSave(formData)} className="bg-[#004990] text-white px-6 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <Save size={14}/> Save Changes
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {activeTab === 'general' ? (
          <div className="flex-1 overflow-y-auto p-12 max-w-2xl mx-auto space-y-8">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Course Title</label>
              <input 
                className="w-full p-4 border-2 border-slate-100 focus:border-[#004990] outline-none font-bold" 
                value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Tagline</label>
              <input 
                className="w-full p-4 border-2 border-slate-100 focus:border-[#004990] outline-none" 
                value={formData.tagline} onChange={e => setFormData({...formData, tagline: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Full Description</label>
              <textarea 
                className="w-full p-4 border-2 border-slate-100 focus:border-[#004990] outline-none h-40" 
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>
        ) : (
          <>
            <aside className="w-80 bg-slate-50 border-r border-slate-200 overflow-y-auto p-6">
              {formData.sections.map((sec, sIdx) => (
                <div key={sIdx} className="mb-10">
                  <div className="flex justify-between items-center mb-4">
                    <input 
                      className="text-[10px] font-black uppercase text-[#F47920] bg-transparent border-b border-transparent focus:border-[#F47920] outline-none"
                      value={sec.title} onChange={e => {
                        const next = [...formData.sections];
                        next[sIdx].title = e.target.value;
                        setFormData({...formData, sections: next});
                      }}
                    />
                    <button onClick={() => addLesson(sIdx)} className="text-[#004990] hover:scale-110 transition-transform"><Plus size={16}/></button>
                  </div>
                  <div className="space-y-1">
                    {sec.lessons.map(les => (
                      <button 
                        key={les.id} onClick={() => setEditingLessonId(les.id)}
                        className={`w-full text-left p-3 text-xs font-bold border ${editingLessonId === les.id ? 'bg-white border-[#004990] text-[#004990] shadow-sm' : 'border-transparent text-slate-500 hover:bg-slate-200'}`}
                      >
                        {les.title}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </aside>
            <main className="flex-1 flex flex-col bg-white">
              {currentLesson ? (
                <div className="flex-1 flex flex-col">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <Type size={16} className="text-slate-300"/>
                      <input 
                        className="text-xl font-bold outline-none flex-1"
                        value={currentLesson.title}
                        onChange={(e) => {
                          const next = [...formData.sections];
                          const secIdx = next.findIndex(s => s.lessons.find(l => l.id === editingLessonId));
                          const lesIdx = next[secIdx].lessons.findIndex(l => l.id === editingLessonId);
                          next[secIdx].lessons[lesIdx].title = e.target.value;
                          setFormData({...formData, sections: next});
                        }}
                      />
                    </div>
                    <button 
                      onClick={() => {
                        const next = [...formData.sections];
                        const sIdx = next.findIndex(s => s.lessons.find(l => l.id === editingLessonId));
                        next[sIdx].lessons = next[sIdx].lessons.filter(l => l.id !== editingLessonId);
                        setFormData({...formData, sections: next});
                        setEditingLessonId(null);
                      }}
                      className="text-red-400 hover:text-red-600 p-2"
                    ><Trash2 size={18}/></button>
                  </div>
                  <div className="flex-1 flex overflow-hidden">
                    <div className="w-1/2 h-full flex flex-col border-r border-slate-100">
                      <div className="bg-slate-50 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Markdown Editor</div>
                      <textarea 
                        className="flex-1 p-8 outline-none font-mono text-sm leading-relaxed resize-none"
                        value={currentLesson.content}
                        onChange={(e) => updateLessonContent(currentLesson.id, e.target.value)}
                      />
                    </div>
                    <div className="w-1/2 h-full overflow-y-auto bg-slate-50 p-10">
                      <div className="max-w-full">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-8 pb-2 border-b border-slate-200">Live Preview</div>
                        <div className="prose prose-slate max-w-none">
                          {currentLesson.content.split('\n').map((line, i) => {
                            if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-[#004990] mb-4">{line.replace('# ', '')}</h1>;
                            if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-slate-800 mb-2">{line.replace('## ', '')}</h2>;
                            return <p key={i} className="text-sm text-slate-600 mb-2">{line}</p>;
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-300 flex-col gap-4">
                  <FileText size={64} strokeWidth={1}/>
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Select a module to edit content</span>
                </div>
              )}
            </main>
          </>
        )}
      </div>
    </div>
  );
}
