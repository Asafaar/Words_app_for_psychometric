import React, { useState, useEffect } from 'react';

import * as XLSX from 'xlsx'

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';

import { Trash } from 'react-bootstrap-icons';


const Flashcards = () => {
  const [cards, setCards] = useState([]);
  const [NewWord, setNewWord] = useState([]);
  const [NewTranslation, setNewTranslation] = useState([]);
  const [countText, setCountText] = useState([]);
  useEffect(() => {
    const fetchCards = async () => {
      const response = await fetch('http://localhost:3001/redfix.xlsx');
      const arrayBuffer = await response.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      const updatedJsonData = jsonData.map((card) => ({ ...card, backgroundColor: 'white', clickCount: card.clickCount || 0 })).sort((a, b) => b.clickCount - a.clickCount);
      setCards(updatedJsonData);
      fetch('http://localhost:3001/gettxt')
        .then(response => response.text())
        .then(data => setCountText(data))
        .catch(error => console.log(error));

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
    await fetch('http://localhost:3001/upload', { method: 'POST', body: formData });
    const data = countText;
    const filename = 'count.txt';
    const textBlob = new Blob([data], { type: 'text/plain' });
    const formData2 = new FormData();
    formData2.append('file', textBlob, filename);
    await fetch('http://localhost:3001/uploadtxt', { method: 'POST', body: formData2 });

  };


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
  const handledel = async (index) => {
    const updatedCards = [...cards];
    updatedCards.splice(index, 1);
    setCards(updatedCards);
    const newCount = parseInt(countText);

    setCountText(newCount + 1);

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

  const mixcards = async () => {
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
  }
  const countredcards = async () => {
    const cardsfix = [...cards].sort((a, b) => b.clickCount - a.clickCount);
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', direction: 'rtl', padding: '10px' }}>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Button variant="outline-primary" style={{ fontSize: '24px', padding: '10px', marginTop: 10 }} onClick={mixcards}>
          Mix the words
        </Button>
        <Button variant="secondary" style={{ fontSize: '24px', padding: '10px', marginTop: 10 }} onClick={countredcards}>
          By Dont know count
        </Button>

        {/* <Button style={{ fontSize: '24px', padding: '10px', marginTop: 10 }} onClick={handleLookup}>
        For test
      </Button> */}
      </div>

      <div style={{ fontSize: '24px', padding: '10px' }}>
      The number of words a user has deleted: {countText}
      </div>
      <Form onSubmit={handleSubmit}>
        <label style={{ fontSize: '24px', padding: '10px', display: 'block' }}>
          <input type="text" value={NewWord} style={{ fontSize: '24px', width: '400px', height: '40px', marginLeft: 10 }} onChange={handleNewWordChange} />
          Word
        </label>

        <label style={{ fontSize: '24px', padding: '10px', display: 'block' }}>

          <input type="text" value={NewTranslation} style={{ fontSize: '24px', width: '400px', height: '40px', marginLeft: 10 }} onChange={handleNewTranslationChange} />
          Translation
        </label>
        <Button variant="outline-primary" style={{ fontSize: '24px', padding: '10px', display: 'block', alignItems: 'center' }} type="submit">Add Word</Button>
      </Form>

      <div style={{ position: 'relative' }}>
        {cards.map((card, index) => (

          <div
            key={index}
            style={{
          
              padding: '10px',
              margin: '10px',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            <Card key={index}>
            <Card.Header style={{fontSize: '30px',textAlign: 'center',backgroundColor: card.backgroundColor}}>{card['מילים']}<p style={{ float: 'right' }}>{index}</p></Card.Header>
              <Card.Body>
                <Card.Title style={{fontSize: '30px',textAlign: 'center'}}>{card.isKnown && <p>{card['תרגום']}</p>}
                </Card.Title>
                <Card.Text>
                </Card.Text>
                <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 5 }}>
                  <Button variant="light" style={{ fontSize: '24px', padding: '10px',marginBottom: 5 }}
                    onClick={() => handlesound(index)}>sound</Button>
                  <div style={{ display: 'flex', flexDirection: 'row',marginLeft:5,justifyContent: 'space-between' }}>
                    <Button variant="warning" style={{ fontSize: '24px', padding: '10px', }} onClick={() => handleRedButtonClick(index)}>Dont know </Button>
                    <Button variant='info' style={{ fontSize: '24px', padding: '10px', }}
                      onClick={() => handleCardClick(index)}>translation</Button>


                    <Button  style={{ fontSize: '24px', padding: '10px', }} onClick={() => handleLookup(index)}>
                      get examples
                    </Button>
                    <Button variant='danger' style={{ fontSize: '24px', padding: '10px', }} onClick={() => handledel(index)}>
                        Delete
                      </Button>
                    
                  </div>
                </div>

              </Card.Body>
            </Card>
          
          </div>
        ))}
        <Button onClick={() => handlesave()} style={{ position: 'fixed', bottom: '20px', right: '20px', fontSize: '24px', padding: '10px' }}>Saved Button</Button>
        <div style={{ position: 'fixed', bottom: '150px', right: '20px', fontSize: '24px', padding: '10px', backgroundColor: '#fff', color: '#000', maxHeight: '200px', maxWidth: '400px', overflowY: 'auto' }}>       <ul>
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
