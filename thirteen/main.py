import pygame
from pygame.locals import *
import random
import numpy as np

#CONSTANTS|||||||||||||||||||

WINDOW_NAME = 'Thirteen'
WINDOW_WIDTH = 800
WINDOW_HEIGHT = 800
FONT = pygame.font.get_default_font()
FONT_SIZE = 24
SCREEN_BG = (255,255,255)
FPS_CAP = 60


#CLASSES|||||||||||||||||||||

class Card():
    def __init__(self, card, suit, rank, card_rank):
        self.card = card
        self.suit = suit
        self.rank = rank
        self.card_rank = card_rank

    def getRank(self):
        return self.rank

    def __str__(self):
        return self.card + " of " + self.suit
    
    def __repr__(self):
        return self.card + " of " + self.suit + "(" + str(self.card_rank) +")"

class Deck():
    def __init__(self):
        self.deck = []
        self.prime()
        
    def suffle(self):
        np.random.shuffle(self.deck)

    def give_hand(self):
        return self.deck.pop()
    
    def prime(self):
        self.deck = []
        rank = 1
        card_rank = 1
        for card in ['3','4','5','6','7','8','9','10','J','Q','K','A','2']:
            for suit in ['spades','clubs','diamonds', 'hearts']:
                self.deck.append(Card(card,suit,rank,card_rank))
                rank += 1
            card_rank += 1
        self.suffle()
        
class Hand():
    def __init__(self, deck):
        self.hand = []
        self.deck = deck
        self.prime()
        
    def sort(self):
        self.hand.sort(key=lambda x: x.rank)

    def prime(self):
        self.hand = []
        for i in range(0,13):
            self.hand.append(self.deck.give_hand())
        self.sort()






class Game():

    def __init__(self):
        pygame.init()
        pygame.font.init()
        pygame.display.set_caption(WINDOW_NAME)
        self.screen = pygame.display.set_mode((WINDOW_WIDTH,WINDOW_HEIGHT))
        self.font = pygame.font.Font(FONT, FONT_SIZE)
        self.clock = pygame.time.Clock()
        self.running = True
        self.set_screen()

    def set_screen(self):
        pygame.display.set_caption(WINDOW_NAME)
        self.screen.fill(SCREEN_BG)


#MAIN LOOP|||||||||||||||||||

def main():
    game = Game()
    deck = Deck()
    Player1 = Hand(deck)
    print(Player1.hand)

    while game.running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                game.running = False
        pygame.display.flip()
        game.clock.tick(FPS_CAP)
    

if __name__ == "__main__":
    main()