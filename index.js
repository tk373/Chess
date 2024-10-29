const gameboard = document.querySelector("#gameboard");
const playerdisplay = document.querySelector("#player");
const infordisplay = document.querySelector("#info-display");
const width = 8;
let playergo = 'white';
playerdisplay.textContent = playergo;
let isInCheck = false;
let startpositionId;
let draggedElement;
let kingMoved = { 'white': false, 'black': false };
let rookMoved = { 'white': { 'left': false, 'right': false }, 'black': { 'left': false, 'right': false } };

document.querySelector("#startGameButton").addEventListener("click", function() {
    createGameBoard();
});

const startpieces = [
    rook, knight, bishop, queen, king, bishop, knight, rook,
    pawn, pawn, pawn, pawn, pawn, pawn, pawn, pawn,
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    pawn, pawn, pawn, pawn, pawn, pawn, pawn, pawn,
    rook, knight, bishop, queen, king, bishop, knight, rook,
]

function createGameBoard() {
    gameboard.innerHTML = ''; // Clear previous board
    const topLeftCorner = document.createElement('div');
    topLeftCorner.classList.add('label');
    gameboard.appendChild(topLeftCorner);

    for (let i = 0; i < width; i++) {
        const letter = document.createElement('div');
        letter.classList.add('label');
        letter.textContent = String.fromCharCode('A'.charCodeAt(0) + i);
        gameboard.appendChild(letter);
    }

    startpieces.forEach((piece, i) => {
        if (i % width === 0) {
            const number = document.createElement('div');
            number.classList.add('label');
            number.textContent = 8 - Math.floor(i / width);
            gameboard.appendChild(number);
        }

        const square = document.createElement('div');
        square.classList.add('square');
        square.innerHTML = piece;
        square.firstChild && square.firstChild.setAttribute('draggable', true);
        square.setAttribute('square-id', i);
        const row = Math.floor(i / width);
        // Calculate chess notation position for this square
        const chessPosition = indexToChessNotation(i);
        square.setAttribute('data-chess-position', chessPosition);


        if (row % 2 === 0) {
            square.classList.add(i % 2 === 0 ? "beige" : "brown");
        } else {
            square.classList.add(i % 2 === 0 ? "brown" : "beige");
        }

        if (i < 16 && square.firstChild) {
            square.firstChild.classList.add('black');
        }
        if (i >= 48 && square.firstChild) {
            square.firstChild.classList.add('white');
        }

        gameboard.appendChild(square);
    });

    // Align the bottom row for characters A-H
    for (let j = 0; j <= width; j++) {
        const bottomAlign = document.createElement('div');
        bottomAlign.classList.add('label');
        if (j === 0) {
            bottomAlign.textContent = '';
        } else {
            bottomAlign.textContent = String.fromCharCode('A'.charCodeAt(0) + j - 1); // Add letters A-H again
        }
        gameboard.appendChild(bottomAlign);
    }

    const allsquares = document.querySelectorAll("#gameboard .square")
    allsquares.forEach(square => {
        square.addEventListener('dragstart', dragStart);
        square.addEventListener('dragover', dragOver);
        square.addEventListener('drop', dragDrop);
    });
}

function indexToChessNotation(index) {
    const width = 8;  // width of the chess board
    const row = Math.floor(index / width) + 1;
    const column = String.fromCharCode('a'.charCodeAt(0) + (index % width));
    return column + (9 - row); // 9 - row because row 1 is at the bottom (8)
}

function dragStart(e){
    if (!e.target.classList.contains(playergo)) {
        e.preventDefault();
    } else {
        startpositionId = e.target.parentNode.getAttribute('square-id');
        draggedElement = e.target;
    }
}

function dragOver(e){
    e.preventDefault()
}

function dragDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const correctGo = draggedElement.classList.contains(playergo);
    const taken = e.target.classList.contains('piece');
    const valid = checkIfValid(e.target);
    const opponentGo = playergo === 'black' ? 'white' : 'black';
    const takenByOpponent = e.target?.classList.contains(opponentGo);
    const targetSquare = e.target.classList.contains('square') ? e.target : e.target.parentNode;
    const targetId = parseInt(targetSquare.getAttribute('square-id'));

    if (draggedElement.id === 'king' && Math.abs(startpositionId - targetId) === 2) {
        if (performCastle(parseInt(startpositionId), targetId)) {
            changePlayer();
        }
        return;
    }

    if (correctGo && valid) {
        if (takenByOpponent) {
            let captureSuccessful = movePiece(startpositionId, targetId, draggedElement);
            if (captureSuccessful) {
                changePlayer();
                if (isKingInCheck(playergo)) {
                    infordisplay.textContent = 'Check!';
                    if (isCheckmate(playergo)) {
                        infordisplay.textContent = playergo + " is in checkmate. Game over.";
                        // Optionally, add any end-of-game handling here
                    } 
                }
            }
        } else if (!taken) {
            if (movePiece(startpositionId, targetId, draggedElement)) {
                changePlayer();
                if (isKingInCheck(playergo)) {
                    infordisplay.textContent = 'Check!';
                    if (isCheckmate(playergo)) {
                        infordisplay.textContent = playergo + " is in checkmate. Game over.";
                        // Optionally, add any end-of-game handling here
                    } 
                }
            }
        }
    }
}

function movePiece(startId, targetId, draggedElement) {
    const opponentGo = playergo === 'black' ? 'white' : 'black';
    const startSquare = document.querySelector(`[square-id="${startId}"]`);
    const targetSquare = document.querySelector(`[square-id="${targetId}"]`);
    const piece = targetSquare.firstChild;

    if (draggedElement.id === 'king' && !kingMoved[playergo]) {
        kingMoved[playergo] = true;
    } else if (draggedElement.id === 'rook') {
        const initialPositions = { 'white': [63, 56], 'black': [7, 0] }; // Assuming standard chess board positions for rooks 'black': [56, 63] 'white': [0, 7]
        if (initialPositions[playergo].includes(Number(startId))) {
            const rookSide = startId % 8 === 0 ? 'left' : 'right';
            rookMoved[playergo][rookSide] = true;
        }
    }
    // Move the piece to the target square temporarily and remove the piece on the targetsquare
    targetSquare.appendChild(draggedElement);
    if(piece){
        piece.remove();
    }

    // Check if the move places your king in check
    if (isKingInCheck(playergo)) {
        // If the move results in a check, undo it
        startSquare.appendChild(draggedElement);
        if (piece) targetSquare.appendChild(piece);
        infordisplay.textContent = 'Check! Move not allowed.';
        return false;
    } else {
        // If the move is valid, update UI and return true
        if (piece) piece.remove(); // Remove the captured piece from the board if any
        infordisplay.textContent = ''; // Clear any previous messages
        return true;
    }
}

function isCheckmate(kingColor) {
    const kingSquareId = findKing(kingColor);
    const kingMoves = [
        kingSquareId - 1, kingSquareId + 1, kingSquareId - width, kingSquareId + width,
        kingSquareId - width - 1, kingSquareId - width + 1, kingSquareId + width - 1, kingSquareId + width + 1
    ];

    let noEscape = kingMoves.every(moveId => {
        // Check if the move is within bounds and the square is not under attack
        return moveId < 0 || moveId >= 64 || simulateMove(kingSquareId, moveId, document.querySelector(`[square-id="${kingSquareId}"]`).firstChild, () => isKingInCheck(kingColor));
    });

    return noEscape && !canBlockOrCapture(kingColor);
}

function calculatePotentialMoves(piece, startId) {
    let moves = [];
    const pieceType = piece.id;
    const pieceColor = piece.classList.contains('white') ? 'white' : 'black';
    const direction = pieceColor === 'white' ? -1 : 1;  // white moves up, black moves down
    const startRow = Math.floor(startId / width);
    const startCol = startId % width;

    switch (pieceType) {
        case 'pawn':
            // Forward move
            let forward = startId + direction * width;
            if (forward >= 0 && forward < 64 && !document.querySelector(`[square-id="${forward}"]`).firstChild) {
                moves.push(forward);
                // Initial double forward move
                if ((pieceColor === 'white' && startRow === 6) || (pieceColor === 'black' && startRow === 1)) {
                    let doubleForward = startId + 2 * direction * width;
                    if (!document.querySelector(`[square-id="${doubleForward}"]`).firstChild) {
                        moves.push(doubleForward);
                    }
                }
            }
            // Captures
            [1, -1].forEach(offset => {
                let diagonal = startId + direction * width + offset;
                if (diagonal >= 0 && diagonal < 64 && ((diagonal % width !== 0 || offset !== -1) && (diagonal % width !== 7 || offset !== 1))) {
                    let targetSquare = document.querySelector(`[square-id="${diagonal}"]`);
                    if (targetSquare.firstChild && targetSquare.firstChild.classList.contains(pieceColor === 'white' ? 'black' : 'white')) {
                        moves.push(diagonal);
                    }
                }
            });
            break;

        case 'knight':
            [-17, -15, -10, -6, 6, 10, 15, 17].forEach(move => {
                let target = startId + move;
                if (target >= 0 && target < 64) {
                    let rowDiff = Math.abs(Math.floor(target / width) - startRow);
                    let colDiff = Math.abs((target % width) - startCol);
                    if ((rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)) {
                        moves.push(target);
                    }
                }
            });
            break;

        case 'bishop':
        case 'rook':
        case 'queen':
            let directions = [];
            if (pieceType === 'bishop' || pieceType === 'queen') {
                directions.push(-width - 1, -width + 1, width - 1, width + 1);  // Diagonal directions
            }
            if (pieceType === 'rook' || pieceType === 'queen') {
                directions.push(-width, width, -1, 1);  // Straight directions
            }
            directions.forEach(dir => {
                for (let pos = startId + dir; pos >= 0 && pos < 64 && Math.floor(pos / width) >= 0 && Math.floor(pos / width) < 8; pos += dir) {
                    // Check bounds for horizontal wrapping
                    if (dir === -1 || dir === 1) {
                        if (Math.floor(pos / width) !== startRow) break;
                    }
                    if (document.querySelector(`[square-id="${pos}"]`).firstChild) {
                        if (document.querySelector(`[square-id="${pos}"]`).firstChild.classList.contains(pieceColor === 'white' ? 'black' : 'white')) {
                            moves.push(pos);
                        }
                        break;
                    }
                    moves.push(pos);
                }
            });
            break;

        case 'king':
            [-width - 1, -width, -width + 1, -1, 1, width - 1, width, width + 1].forEach(move => {
                let target = startId + move;
                if (target >= 0 && target < 64 && Math.abs(Math.floor(target / width) - startRow) <= 1 && Math.abs((target % width) - startCol) <= 1) {
                    moves.push(target);
                }
            });
            break;
    }
    return moves.filter(move => move >= 0 && move < 64); // Filter out-of-bounds moves
}


function canBlockOrCapture(kingColor) {
    const opponentColor = kingColor === 'white' ? 'black' : 'white';
    const pieces = document.querySelectorAll(`.square .${kingColor}`);
    let canBlock = false;

    pieces.forEach(piece => {
        const startId = parseInt(piece.parentNode.getAttribute('square-id'), 10);
        const potentialMoves = calculatePotentialMoves(piece, startId);

        potentialMoves.forEach(moveId => {
            if (simulateMove(startId, moveId, piece, () => !isKingInCheck(kingColor))) {
                canBlock = true;
            }
        });
    });

    return canBlock;
}

function simulateMove(startId, targetId, pieceElement, callback) {
    const startSquare = document.querySelector(`[square-id="${startId}"]`);
    const targetSquare = document.querySelector(`[square-id="${targetId}"]`);
    const capturedPiece = targetSquare.firstChild;

    // Move the piece to simulate
    targetSquare.appendChild(pieceElement.cloneNode(true));
    if (capturedPiece) {
        capturedPiece.style.display = 'none'; // Temporarily hide the captured piece
    }

    // Execute callback to check condition (like check status)
    const result = callback();

    // Undo the move
    startSquare.appendChild(pieceElement);
    if (capturedPiece) {
        capturedPiece.style.display = 'block';
    }
    if (targetSquare.firstChild === pieceElement) {
        targetSquare.removeChild(pieceElement);
    }

    return result;
}

function isSquareOccupied(squareId) {
    const square = document.querySelector(`[square-id="${squareId}"]`);
    if(square.firstChild){
        return true
    }
    return false;
}

function changePlayer(){
    if(playergo === 'black'){
        playergo = 'white';
        playerdisplay.textContent = 'white';
    } else {
        playergo = 'black';
        playerdisplay.textContent = 'black';
    }
}

function checkIfValid(target) {
    const targetId = Number(target.getAttribute('square-id')) || Number(target.parentNode.getAttribute('square-id'));
    const startId = Number(startpositionId);
    const piece = draggedElement.id;
    const pieceColor = draggedElement.classList.contains('white') ? 'white' : 'black';
    const direction = pieceColor === 'white' ? -1 : 1;

    switch (piece) {
        case 'pawn':
            // Standard forward move
            if (targetId === startId + direction * width && !target.firstChild) {
                return true;
            }
            // Double move from the starting position
            if ((pieceColor === 'white' && Math.floor(startId / width) === 6 || pieceColor === 'black' && Math.floor(startId / width) === 1) &&
                targetId === startId + direction * 2 * width &&
                !target.firstChild &&
                !document.querySelector(`[square-id="${startId + direction * width}"]`).firstChild) {
                return true;
            }
            const captureTargets = [startId + direction * width - 1, startId + direction * width + 1];
            if (captureTargets.includes(targetId)) {
                const targetSquare = document.querySelector(`[square-id="${targetId}"]`);
                if (targetSquare && targetSquare.firstChild && targetSquare.firstChild.classList.contains(pieceColor === 'white' ? 'black' : 'white')) {
                    return true;
                }
            }
            break;
            case 'knight':
                const knightMoves = [
                    -17, -15, -10, -6, 6, 10, 15, 17
                ];
                if (knightMoves.includes(targetId - startId)) {
                    const colStart = startId % width;
                    const colTarget = targetId % width;
                    const rowStart = Math.floor(startId / width);
                    const rowTarget = Math.floor(targetId / width);
                    const rowDiff = Math.abs(rowTarget - rowStart);
                    const colDiff = Math.abs(colTarget - colStart);
    
                    if (rowDiff == 1 && colDiff == 2 || rowDiff == 2 && colDiff == 1) {
                        return true;
                    }
                }
                break;

        case 'bishop':
            return DiagonalValidMoves(startId, targetId);

        case 'rook':
            return horizontalVertikalMoves(startId, targetId);

        case 'queen':
            return (DiagonalValidMoves(startId, targetId) || horizontalVertikalMoves(startId, targetId));

        case 'king':
            const kingMoves = [
                startId - 1, startId + 1, startId - width, startId + width,
                startId - width - 1, startId - width + 1, startId + width - 1, startId + width + 1
            ];
            if (kingMoves.includes(targetId)) {
                const colStart = startId % width;
                const colTarget = targetId % width;
                if (Math.abs(colTarget - colStart) <= 1) {
                    return true;
                }
            }
            break;
    }
    return false;
}

function DiagonalValidMoves(startId, targetId) {
    const directions = [-width - 1, -width + 1, width - 1, width + 1];
    return checkLinearMove(startId, targetId, directions);
}

function horizontalVertikalMoves(startId, targetId) {
    const directions = [-1, 1, -width, width]; // Directions for horizontal and vertical moves
    const startRow = Math.floor(startId / width);
    const startCol = startId % width;

    for (let direction of directions) {
        let pos = startId + direction;
        let currentRow = Math.floor(pos / width);
        let currentCol = pos % width;

        while (pos >= 0 && pos < 64) { // Ensure the position is within bounds
            // Ensure we do not wrap around the board horizontally or vertically
            if ([1, -1].includes(direction) && (currentCol < 0 || currentCol >= width || currentRow !== startRow)) {
                break;
            }
            if ([width, -width].includes(direction) && (currentRow < 0 || currentRow >= width)) {
                break;
            }

            if (pos === targetId) return true; // Target position reached

            // Check if there's a piece blocking the path (break if so)
            if (document.querySelector(`[square-id="${pos}"]`).firstChild) break;

            // Continue moving in the direction
            pos += direction;
            currentRow = Math.floor(pos / width);
            currentCol = pos % width;
        }
    }
    return false;
}


function checkLinearMove(startId, targetId, directions) {
    for (let direction of directions) {
        let pos = startId + direction;
        while (pos >= 0 && pos < 64) {
            const colDifference = Math.abs(Math.floor(pos % width) - Math.floor(startId % width));
            const rowDifference = Math.abs(Math.floor(pos / width) - Math.floor(startId / width));

            if ([1, -1].includes(direction) && colDifference > 1) break;
            if ([width, -width].includes(direction) && rowDifference > 1) break;

            if (pos === targetId) return true;
            if (document.querySelector(`[square-id="${pos}"]`).firstChild) break;

            pos += direction;
        }
    }
    return false;
}

function isKingInCheck(player) {
    let kingPosition = findKing(player);
    if (kingPosition === undefined) {
        console.error(player + ' king not found on the board.');
        return false; 
    }

    let opponent = player === 'white' ? 'black' : 'white';
    let threatDirections = [
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, // left, right
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, // up, down
        { dx: -1, dy: -1 }, { dx: 1, dy: 1 }, // up-left, down-right
        { dx: 1, dy: -1 }, { dx: -1, dy: 1 }  // up-right, down-left
    ];

    // Check for linear threats from rook, queen, bishop
    if (checkLinearThreats(kingPosition, threatDirections, opponent)) {
        return true;
    }
    // Check for knight threats
    if (checkKnightThreat(kingPosition, opponent)) {
        console.log("kngiht thread");
        return true;
    }

    // Check for pawn threats
    if (checkPawnThreat(kingPosition, opponent)) {
        return true;
    }

    return false; // No threats detected
}

function IsSquareInCheck(player, squareId) {
    let opponent = player === 'white' ? 'black' : 'white';
    let threatDirections = [
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, // left, right
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, // up, down
        { dx: -1, dy: -1 }, { dx: 1, dy: 1 }, // up-left, down-right
        { dx: 1, dy: -1 }, { dx: -1, dy: 1 }  // up-right, down-left
    ];

    // Check for linear threats from rook, queen, bishop
    if (checkLinearThreats(squareId, threatDirections, opponent)) {
        return true;
    }
    // Check for knight threats
    if (checkKnightThreat(squareId, opponent)) {
        return true;
    }

    // Check for pawn threats
    if (checkPawnThreat(squareId, opponent)) {
        return true;
    }

    return false; // No threats detected
}

function findKing(player) {
    const playerGo = `${player}`;

    const squares = document.querySelectorAll('#gameboard .square');

    for (let square of squares) {
        if (square.firstChild  && square.firstChild.classList.contains(playerGo) && square.firstChild.id === "king") {
            return square.getAttribute('square-id');    
        }
    }

    // Return undefined if the king is not found
    return undefined;
}

function checkLinearThreats(kingPosition, directions, opponent) {
    const width = 8; // Assuming the board is 8x8
    const kingRow = Math.floor(kingPosition / width);
    const kingCol = kingPosition % width;

    for (let dir of directions) {
        let row = kingRow + dir.dy;
        let col = kingCol + dir.dx;

        while (row >= 0 && row < width && col >= 0 && col < width) {
            const id = row * width + col;
            const square = document.querySelector(`[square-id="${id}"]`);

            if (square && square.firstChild) {
                const piece = square.firstChild;
                if (piece.classList.contains(opponent)) {
                    // Log the threatening piece and its position if it can move in a straight line and matches the type that can threaten from the current direction
                    if ((dir.dx === 0 || dir.dy === 0) && (piece.id === 'queen' || piece.id === 'rook') ||
                        (dir.dx !== 0 && dir.dy !== 0) && (piece.id === 'queen' || piece.id === 'bishop')) {
                        console.log(`King is in check by ${piece.id} at position (${row}, ${col})`);
                        return true;
                    }
                }
                break; // Any piece blocks further line of sight
            }

            row += dir.dy;
            col += dir.dx;
        }
    }
    return false;
}

function checkKnightThreat(kingPosition, opponent) {
    // Calculate row and column from kingPosition
    let kingRow = Math.floor(kingPosition / 8);
    let kingCol = kingPosition % 8;

    let potentialPositions = [
        { row: kingRow + 2, col: kingCol + 1 },
        { row: kingRow + 2, col: kingCol - 1 },
        { row: kingRow - 2, col: kingCol + 1 },
        { row: kingRow - 2, col: kingCol - 1 },
        { row: kingRow + 1, col: kingCol + 2 },
        { row: kingRow + 1, col: kingCol - 2 },
        { row: kingRow - 1, col: kingCol + 2 },
        { row: kingRow - 1, col: kingCol - 2 }
    ].filter(pos => pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8)
     .map(pos => pos.row * 8 + pos.col); // Convert row, col back to position

    return potentialPositions.some(pos => {
        const square = document.querySelector(`[square-id="${pos}"]`);
        return square && square.firstChild && square.firstChild.classList.contains(opponent) && square.firstChild.id === "knight";
    });
}

function checkPawnThreat(kingPosition, opponent) {
    const kingRow = Math.floor(Number(kingPosition) / width);
    const kingCol = Number(kingPosition) % width;
    const direction = opponent === 'black' ? -1 : 1;  // Assuming white moves upwards

    const potentialThreats = [
        Number(Number(kingPosition) + direction * width - 1), 
        Number(Number(kingPosition) + direction * width + 1)
    ];

    // Check each position for a threatening pawn
    return potentialThreats.some(pos => {
        if (pos < 0 || pos >= 64) return false; // Ensure position is within bounds
        const square = document.querySelector(`[square-id="${pos}"]`);
        return square && square.firstChild && 
               square.firstChild.classList.contains(opponent) &&
               square.firstChild.id === 'pawn';
    });
}

function canCastle(startId, targetId) {
    startId = parseInt(startId, 10);
    targetId = parseInt(targetId, 10);

    const direction = targetId > startId ? 'right' : 'left';
    const rookId = direction === 'right' ? startId + 3 : startId - 4;
    if (kingMoved[playergo] || rookMoved[playergo][direction]) {
        console.log("Castling failed: King or Rook has moved");
        return false;
    }

    const step = direction === 'right' ? + 1 : -1;
    const endSquare = direction === 'right' ? rookId - 1 : rookId + 1;

    for (let i = startId + step; i !== endSquare + step; i += step) {
    // Check each square to see if it is occupied
    if (document.querySelector(`[square-id="${i}"]`).firstChild) {
        console.log(`Checking path for castling: King at ${startId}, Rook at ${rookId}, direction ${direction}, checking from ${startId + step} to ${endSquare}`);
        return false;
    }
    }

    if (isKingInCheckDuringCastling(startId, step, targetId)) {
        console.log("Castling failed: King cannot castle in or through checks");
        return false;
    }
    console.log(`Checking path for castling: King at ${startId}, Rook at ${rookId}, direction ${direction}, checking from ${startId + step} to ${endSquare}`);
    return true;
}

function performCastle(startId, targetId) {
    if (!canCastle(startId, targetId)) {
        console.log("Castling not allowed");
        return;
    }

    const direction = targetId > startId ? 'right' : 'left';
    const rookStartId = direction === 'right' ? startId + 3 : startId - 4;
    const rookEndId = direction === 'right' ? targetId - 1 : targetId + 1;

    const king = document.querySelector(`[square-id="${startId}"]`).firstChild;
    const rook = document.querySelector(`[square-id="${rookStartId}"]`).firstChild;

    document.querySelector(`[square-id="${targetId}"]`).appendChild(king);
    document.querySelector(`[square-id="${rookEndId}"]`).appendChild(rook);

    kingMoved[playergo] = true;
    rookMoved[playergo][direction] = true;
    changePlayer();
}

function isKingInCheckDuringCastling(startId, step, targetId) {
    const positionsToCheck = [startId, startId + step, targetId];
    for (let position of positionsToCheck) {
        if (IsSquareInCheck(playergo, position)) {
            return true;
        }
    }
    return false;
}