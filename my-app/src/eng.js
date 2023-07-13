import React, { useState, useEffect } from 'react';
import { csv } from 'csvtojson';
import { json2csv } from 'json-2-csv';
import * as XLSX from 'xlsx'
import { getDef } from 'word-definition';


const Flashcards = () => {
  const [cards, setCards] = useState([]);
  const [NewWord, setNewWord] = useState([]);
  const [NewTranslation, setNewTranslation] = useState([]);

  useEffect(() => {
    const fetchCards = async () => {
      const response = await fetch('http://localhost:3001/redfix.xlsx');
      const arrayBuffer = await response.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      const updatedJsonData = jsonData.map((card) => ({ ...card, backgroundColor: 'white',clickCount: card.clickCount || 0 })).sort((a, b) => b.clickCount - a.clickCount);
  
      setCards(updatedJsonData);
    };
  
    fetchCards();
  }, []);
  const handleCardClick = (index) => {
    // Toggle the knowledge state of the clicked card
    const updatedCards = [...cards];
    updatedCards[index].isKnown = !updatedCards[index].isKnown;
    updatedCards[index].backgroundColor = updatedCards[index].backgroundColor === 'green' ? 'white' : 'green';
    setCards(updatedCards);
  };

  const handleRedButtonClick = (index) => {
    // Change the background color of the clicked card to red
    const updatedCards = [...cards];
    updatedCards[index].clickCount = (updatedCards[index].clickCount || 0) + 1;
    console.log(updatedCards[index].clickCount);
    cards[index].backgroundColor = 'red';
    console.log(cards);
    setCards(updatedCards);
  };
  
  const handlesave = async () => {
    // Export the red words to an Excel file
    const updatedCards = cards.map((card) => ({ ...card, isKnown: false }));
    const worksheet = XLSX.utils.json_to_sheet(updatedCards);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const excelData = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
    const blob = new Blob([s2ab(excelData)], { type: 'application/octet-stream' });
    const formData = new FormData();
    formData.append('file', blob, 'redfix.xlsx');
    await fetch('http://localhost:3001/upload', { method: 'POST', body: formData });  };


  function s2ab(s) {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) {
      view[i] = s.charCodeAt(i) & 0xff;
    }
    return buf;
  }
  const handlesound = (index) => {
    const utterance = new SpeechSynthesisUtterance(cards[index]['מילים']);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
  }
  const handledel= async (index)=>{
    const updatedCards = [...cards];
    updatedCards.splice(index,1);
    setCards(updatedCards);
    

  }
  const handleSubmit = (event) => {
    event.preventDefault();
    const newCard = {
      'מילים': NewWord,
      'תרגום': NewTranslation,
      backgroundColor: 'white',
      isKnown: false,
    };
    setCards([...cards, newCard]);
    setNewWord('');
    setNewTranslation('');
  };
  const savechanges= async ()=>{
    const updatedCards = cards.map((card) => ({ ...card, isKnown: false }));
    const worksheet = XLSX.utils.json_to_sheet(updatedCards);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const excelData = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
    const blob = new Blob([s2ab(excelData)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'redfix.xlsx');
    link.click();
  }
  const mixcards= async ()=>{
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
  }
  const countredcards= async ()=>{
    const cardsfix=[...cards].sort((a, b) => b.clickCount - a.clickCount);
    setCards(cardsfix);
  } 
  const handleNewTranslationChange = (event) => {
    setNewTranslation(event.target.value);
  };
  const handleNewWordChange = (event) => {
    setNewWord(event.target.value);
  };
  const [word, setWord] = useState('');
  const [examples, setExamples] = useState([]);

  const handleLookup = (index) => {
    setWord(cards[index]['מילים']);
  };
  useEffect(() => {
    if (word) {
      fetch(`http://localhost:3001/word?word=${word}`)
        .then(response => response.json())
        .then(data => {
          setExamples(data.examples);
        })
        .catch(error => {
          console.error(error);
          setExamples([]);
        });
    } else {
      setExamples([]);
    }
  }, [word]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', direction: 'rtl' }}>
      <button style={{ fontSize: '24px', padding: '10px' }} onClick={() => handlesave()}> save the red</button>
      <button style={{ fontSize: '24px', padding: '10px' }} onClick={() => savechanges()}> save changes</button>
      <button style={{ fontSize: '24px', padding: '10px' }} onClick={() => mixcards()}> mix</button>
      <button style={{ fontSize: '24px', padding: '10px' }} onClick={() => countredcards()}> by conut</button>
      <button style={{ fontSize: '24px', padding: '10px' }} onClick={handleLookup}> for test</button>
      <form onSubmit={handleSubmit} >
      <label style={{ fontSize: '24px', padding: '10px', display: 'block' }}>
    
        <input type="text" value={NewWord} style={{fontSize: '24px', width: '400px', height: '40px' }} onChange={handleNewWordChange} />
        Word:
      </label>

      <label style={{ fontSize: '24px', padding: '10px',display: 'block' }}>
     
        <input type="text" value={NewTranslation} style={{fontSize: '24px', width: '400px', height: '40px' }} onChange={handleNewTranslationChange} />
        Translation:
      </label>
      <button style={{ fontSize: '24px', padding: '10px',display: 'block',alignItems: 'center' }} type="submit">Add Word</button>
    </form>
      <div style={{ position: 'relative' }}>
        {cards.map((card, index) => (
          <div
            key={index}
            style={{
              backgroundColor: card.backgroundColor,
              padding: '10px',
              margin: '10px',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            <p>{index}</p>
            <div style={{ direction: 'rtl', justifyContent: 'center' }}>
              <h2>
                {card['מילים']}
                {card.isKnown && <p>{card['תרגום']}</p>}
              </h2>
            </div>
            <button style={{ fontSize: '24px', padding: '10px' }} onClick={() => handleRedButtonClick(index)}>Red </button>
            <button style={{ fontSize: '24px', padding: '10px' }}
              onClick={() => handleCardClick(index)}>Toggle Knowledge</button>
            <button style={{ fontSize: '24px', padding: '10px' }}
              onClick={() => handlesound(index)}>sound</button>
            <button style={{ fontSize: '24px', padding: '10px' }} onClick={() => handledel(index)}>
              Delete
            </button>
            <button style={{ fontSize: '24px', padding: '10px' }} onClick={() => handleLookup(index)}>
              get examples
            </button>
          </div>
        ))}
        <button onClick={() => handlesave()} style={{ position: 'fixed', bottom: '20px', right: '20px', fontSize: '24px', padding: '10px' }}>Saved Button</button>
   <div style={{ position: 'fixed', bottom: '150px', right: '20px', fontSize: '24px', padding: '10px', backgroundColor: '#333', color: '#fff', maxHeight: '200px', maxWidth:'500px', overflowY: 'auto' }}>       <ul>
          {examples.map(example => (
            <li key={example}>{example}</li>
          ))}
        </ul>
        </div>
      </div>
     
    </div>
  );
};

export default Flashcards;
