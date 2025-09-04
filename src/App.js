import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [vocabulary, setVocabulary] = useState([]);
  const [inputText, setInputText] = useState('');
  const [settings, setSettings] = useState({
    timeLimit: 0,
    numWords: 10,
    repetitions: 1,
    feedbackMode: 'immediate',
  });
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [intervalId, setIntervalId] = useState(null);
  const [animationTrigger, setAnimationTrigger] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [font, setFont] = useState('arial');
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [tempTheme, setTempTheme] = useState(theme);
  const [tempFont, setTempFont] = useState(font);

  useEffect(() => {
    const firstTime = localStorage.getItem('firstTime');
    if (firstTime === null) {
      localStorage.setItem('firstTime', 'false');
      setIsFirstTime(true);
    } else {
      setIsFirstTime(false);
    }

    const storedVocab = localStorage.getItem('vocabulary');
    if (storedVocab) {
      setVocabulary(JSON.parse(storedVocab));
    }

    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      setTheme(storedTheme);
      setTempTheme(storedTheme);
    }

    const storedFont = localStorage.getItem('font');
    if (storedFont) {
      setFont(storedFont);
      setTempFont(storedFont);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('vocabulary', JSON.stringify(vocabulary));
  }, [vocabulary]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('font', font);
    document.body.className = `${theme} ${font}`;
  }, [theme, font]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const addVocabularyFromText = () => {
    const newWords = inputText.split(',').map(item => item.trim().split(':'));
    const newVocab = newWords.map(([word, meaning]) => ({
      word: word?.trim(),
      meaning: meaning?.trim(),
      encounters: 0,
      correct: 0,
    })).filter(item => item.word && item.meaning);
    setVocabulary(prev => {
      const updated = [...prev, ...newVocab];
      newVocab.forEach(item => {
        setAnimationTrigger(prev => ({ ...prev, [item.word]: 'added' }));
        setTimeout(() => {
          setAnimationTrigger(prev => ({ ...prev, [item.word]: '' }));
        }, 500);
      });
      return updated;
    });
    setInputText('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const newWords = text.split(',').map(item => item.trim().split(':'));
        const newVocab = newWords.map(([word, meaning]) => ({
          word: word?.trim(),
          meaning: meaning?.trim(),
          encounters: 0,
          correct: 0,
        })).filter(item => item.word && item.meaning);
        setVocabulary(prev => {
          const updated = [...prev, ...newVocab];
          newVocab.forEach(item => {
            setAnimationTrigger(prev => ({ ...prev, [item.word]: 'added' }));
            setTimeout(() => {
              setAnimationTrigger(prev => ({ ...prev, [item.word]: '' }));
            }, 500);
          });
          return updated;
        });
      };
      reader.readAsText(file);
    }
  };

  const handleSettingChange = (key, value) => {
    const parsedValue = key === 'feedbackMode' ? value : parseInt(value) || 0;
    setSettings(prev => ({ ...prev, [key]: parsedValue }));
  };

  const startQuiz = () => {
    if (vocabulary.length < 4) {
      alert('Cần ít nhất 4 từ để tạo quiz.');
      return;
    }
    if (settings.numWords > vocabulary.length) {
      alert('Số lượng từ sẽ học không được lớn hơn số từ hiện có.');
      return;
    }

    const uniqueWords = vocabulary.sort(() => Math.random() - 0.5).slice(0, settings.numWords);
    const selectedWords = [];
    uniqueWords.forEach(word => {
      for (let r = 0; r < settings.repetitions; r++) {
        selectedWords.push(word);
      }
    });
    selectedWords.sort(() => Math.random() - 0.5);

    const quizQuestions = selectedWords.map(word => {
      const options = [word.meaning];
      const wrongOptions = vocabulary
        .filter(v => v.word !== word.word)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(v => v.meaning);
      options.push(...wrongOptions);
      options.sort(() => Math.random() - 0.5);
      return { word: word.word, correct: word.meaning, options };
    });

    setQuestions(quizQuestions);
    setAnswers([]);
    setScore(0);
    setCurrentQuestion(0);
    setQuizStarted(true);
    setShowResults(false);
    setElapsedTime(0);

    const id = setInterval(() => {
      setElapsedTime(prev => {
        const newTime = prev + 1;
        if (settings.timeLimit > 0 && newTime >= settings.timeLimit) {
          clearInterval(id);
          endQuiz(false);
        }
        return newTime;
      });
    }, 1000);
    setIntervalId(id);
  };

  const handleAnswer = (selected) => {
    const question = questions[currentQuestion];
    const isCorrect = selected === question.correct;
    setAnswers(prev => [...prev, { question, selected, isCorrect }]);

    if (settings.feedbackMode === 'immediate') {
      setFeedback({ isCorrect, correctAnswer: question.correct });
    }

    if (isCorrect) setScore(prev => prev + 1);

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      endQuiz(true);
    }
  };

  const endQuiz = (completed = false) => {
    setQuizStarted(false);
    if (intervalId) clearInterval(intervalId);
    setElapsedTime(0);

    if (completed) {
      setVocabulary(prev => prev.map(v => {
        const wordAnswers = answers.filter(a => a.question.word === v.word);
        const encounters = wordAnswers.length;
        const correct = wordAnswers.filter(a => a.isCorrect).length;
        return {
          ...v,
          encounters: v.encounters + encounters,
          correct: v.correct + correct,
        };
      }));
    }

    setShowResults(true);
  };

  const handleExit = () => {
    if (window.confirm('Bạn có chắc muốn thoát? Kết quả sẽ không được lưu.')) {
      endQuiz(false);
    }
  };

  const deleteWord = (word) => {
    setAnimationTrigger(prev => ({ ...prev, [word]: 'removed' }));
    setTimeout(() => {
      setVocabulary(prev => prev.filter(v => v.word !== word));
      setAnimationTrigger(prev => ({ ...prev, [word]: '' }));
    }, 500);
  };

  const deleteAll = () => {
    setVocabulary(prev => {
      prev.forEach(v => {
        setAnimationTrigger(prevTrigger => ({ ...prevTrigger, [v.word]: 'removed' }));
      });
      setTimeout(() => {
        setVocabulary([]);
        setAnimationTrigger({});
      }, 500);
      return prev;
    });
  };

  const handleThemeChange = (e) => {
    setTempTheme(e.target.value);
  };

  const handleFontChange = (e) => {
    setTempFont(e.target.value);
  };

  const saveTheme = () => {
    setTheme(tempTheme);
    setFont(tempFont);
    setShowThemeModal(false);
  };

  const cancelTheme = () => {
    setTempTheme(theme);
    setTempFont(font);
    setShowThemeModal(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const themes = [
    { value: 'light', label: 'Nền Sáng (Trắng, chữ đen)' },
    { value: 'dark', label: 'Nền Tối (Xám đen, chữ trắng)' },
    { value: 'pastel-pink', label: 'Nền Hồng Pastel' },
    { value: 'blackpink', label: 'Nền Blackpink (Xám đen, chữ hồng)' },
  ];

  const fonts = [
    { value: 'arial', label: 'Arial', style: { fontFamily: 'Arial, sans-serif' } },
    { value: 'comic-sans', label: 'Comic Sans MS', style: { fontFamily: "'Comic Sans MS', cursive, sans-serif" } },
    { value: 'papyrus', label: 'Papyrus', style: { fontFamily: "'Papyrus', fantasy, sans-serif" } },
    { value: 'bubblegum-sans', label: 'Bubblegum Sans', style: { fontFamily: "'Bubblegum Sans', cursive, sans-serif" } },
    { value: 'annie-use-your-telescope', label: 'Annie Use Your Telescope', style: { fontFamily: "'Annie Use Your Telescope', cursive, sans-serif" } },
    { value: 'indie-flower', label: 'Indie Flower', style: { fontFamily: "'Indie Flower', cursive, sans-serif" } },
  ];

  return (
    <>
      {!isFirstTime && !quizStarted && !showResults && (
        <nav>
          <div>
            <img src="/app.png" alt="App Icon" className="app-icon" onClick={scrollToTop}></img>
            <a href="#input">Nhập từ vựng</a>
            <a href="#settings">Điều chỉnh</a>
            <a href="#quiz">Làm bài</a>
            <a href="#history">Lịch sử</a>
          </div>
          <button className="settings-gear" onClick={() => setShowThemeModal(true)}>⚙️</button>
        </nav>
      )}
      <div className="container">
        {isFirstTime ? (
          <div className="block">
            <h1>Giới thiệu</h1>
            <p>Chào mừng bạn đến với trang web học từ vựng! Đây là lần đầu bạn truy cập.</p>
            <p>- Khối nhập từ vựng: Thêm từ mới qua textbox hoặc file (định dạng: word:meaning, word2:meaning2,...)</p>
            <p>- Khối điều chỉnh: Thiết lập thời gian, số từ, số lặp, chế độ phản hồi.</p>
            <p>- Khối làm bài: Bắt đầu quiz trắc nghiệm nghĩa của từ.</p>
            <p>- Khối lịch sử: Xem từ đã học, thống kê, xóa từ.</p>
            <p>Tất cả dữ liệu lưu local để sử dụng nhiều lần.</p>
            <button onClick={() => setIsFirstTime(false)}>Đóng</button>
          </div>
        ) : quizStarted ? (
          <div className="quiz-container block">
            {feedback && (
              <div className={`feedback-box ${feedback.isCorrect ? 'correct' : 'wrong'}`}>
                <span>{feedback.isCorrect ? '✔' : '✘'}</span>
                <span>Đáp án: {feedback.correctAnswer}</span>
              </div>
            )}
            <p>Thời gian đã làm: {elapsedTime} giây {settings.timeLimit > 0 && `/ ${settings.timeLimit} giây`}</p>
            <p>Câu hỏi {currentQuestion + 1}/{questions.length}: Nghĩa của "{questions[currentQuestion].word}" là?</p>
            {questions[currentQuestion].options.map((opt, idx) => (
              <button key={idx} onClick={() => handleAnswer(opt)}>{opt}</button>
            ))}
            <button className="exit" onClick={handleExit}>Thoát</button>
          </div>
        ) : showResults ? (
          <div className="results block">
            <h2>Kết quả</h2>
            <p>Điểm: {score}/{questions.length} ({((score / questions.length) * 100).toFixed(2)}% đúng)</p>
            {answers.some(ans => !ans.isCorrect) ? (
              <>
                <h3>Các từ trả lời sai:</h3>
                {answers.filter(ans => !ans.isCorrect).map((ans, idx) => (
                  <p key={idx}>
                    {ans.question.word}: Bạn chọn {ans.selected}, đúng là {ans.question.correct}
                  </p>
                ))}
              </>
            ) : (
              <p>Chúc mừng! Bạn trả lời đúng tất cả câu hỏi.</p>
            )}
            <button onClick={() => setShowResults(false)}>Quay lại</button>
          </div>
        ) : (
          <>
            <div className="block" id="input">
              <h1>Khối nhập từ vựng</h1>
              <textarea value={inputText} onChange={handleInputChange} placeholder="word:meaning, word2:meaning2,..." />
              <button onClick={addVocabularyFromText}>Thêm từ text</button>
              <input type="file" onChange={handleFileUpload} />
            </div>

            <div className="block" id="settings">
              <h1>Khối điều chỉnh trước khi làm bài</h1>
              <label>Thời gian làm bài (giây, 0 = không giới hạn):</label>
              <input type="number" min="0" value={settings.timeLimit} onChange={(e) => handleSettingChange('timeLimit', e.target.value)} />
              <br />
              <label>Số lượng từ sẽ học (tối đa {vocabulary.length}):</label>
              <input type="number" min="1" value={settings.numWords} onChange={(e) => handleSettingChange('numWords', e.target.value)} />
              <br />
              <label>Số lần gặp lại 1 từ:</label>
              <input type="number" min="1" value={settings.repetitions} onChange={(e) => handleSettingChange('repetitions', e.target.value)} />
              <br />
              <label>Biết đáp án:</label>
              <select value={settings.feedbackMode} onChange={(e) => handleSettingChange('feedbackMode', e.target.value)}>
                <option value="immediate">Sau mỗi câu</option>
                <option value="end">Sau khi làm xong toàn bộ</option>
              </select>
            </div>

            <div className="block" id="quiz">
              <h1>Khối làm bài</h1>
              <button onClick={startQuiz}>Bắt đầu làm bài</button>
            </div>

            <div className="block" id="history">
              <h1>Khối lịch sử làm bài</h1>
              {vocabulary.length > 0 ? (
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Từ</th>
                      <th>Nghĩa</th>
                      <th>Gặp</th>
                      <th>Đúng</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vocabulary.map((v, idx) => (
                      <tr key={idx} className={animationTrigger[v.word] || ''}>
                        <td>{v.word}</td>
                        <td>{v.meaning}</td>
                        <td>{v.encounters}</td>
                        <td>{v.correct}</td>
                        <td>
                          <button onClick={() => deleteWord(v.word)}>Xóa</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>Chưa có từ vựng nào.</p>
              )}
              <button onClick={deleteAll}>Xóa tất cả</button>
            </div>
          </>
        )}
      </div>
      <footer>Grok - 2025 - TruongLevi</footer>

      {showThemeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Cài đặt giao diện</h2>
            <h3>Chủ đề màu</h3>
            {themes.map((t) => (
              <label key={t.value}>
                <input
                  type="radio"
                  value={t.value}
                  checked={tempTheme === t.value}
                  onChange={handleThemeChange}
                />
                {t.label}
              </label>
            ))}
            <h3>Phông chữ</h3>
            {fonts.map((f) => (
              <label key={f.value} style={f.style}>
                <input
                  type="radio"
                  value={f.value}
                  checked={tempFont === f.value}
                  onChange={handleFontChange}
                />
                {f.label}
              </label>
            ))}
            <button onClick={saveTheme}>Lưu</button>
            <button className="cancel" onClick={cancelTheme}>Hủy</button>
          </div>
        </div>
      )}
    </>
  );
};

export default App;