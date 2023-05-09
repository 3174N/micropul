#!/usr/bin/env python3

import cv2
import numpy as np
import os

empty = cv2.imread("./empty.png")
white = cv2.imread("./white_circle.png")
black = cv2.imread("./black_circle.png")
one_dot = cv2.imread("./one_dot.png")
two_dots = cv2.imread("./two_dots.png")
plus = cv2.imread("./plus.png")

BLANK = 0
WHITE = 1
BLACK = 2
ONE_DOT = 3
TWO_DOTS = 4
PLUS = 5

templates = {BLANK: empty, WHITE: white,
             BLACK: black, ONE_DOT: one_dot, TWO_DOTS: two_dots, PLUS: plus}


def most_similar(qrtr):
    # Define the similarity metric function
    def mse(image1, image2):
        err = np.sum((image1.astype("float") - image2.astype("float")) ** 2)
        err /= float(image1.shape[0] * image1.shape[1])
        return err

    # Initialize the minimum MSE and the most similar image
    min_mse = float('inf')
    most_similar_image = ""

    # Loop over all images in the directory
    for image in templates:
        # Compute the MSE between the reference image and the current image
        current_mse = mse(qrtr, templates[image])

        # Update the minimum MSE and the most similar image if necessary
        if current_mse < min_mse:
            min_mse = current_mse
            most_similar_image = image

    return most_similar_image


def draw(x, y, shape):
    posx = 25 + 50 * x
    posy = 25 + 50 * y
    match(shape):
        case 0:
            return ''
        case 1:
            return f'<circle cx="{posx}" cy="{posy}" r="15" fill="none" stroke="black"/>'
        case 2:
            return f'<circle cx="{posx}" cy="{posy}" r="15" fill="black" stroke="black"/>'
        case 3:
            return f'<circle cx="{posx}" cy="{posy}" r="3" fill="black"/>'
        case 4:
            return f'<circle cx="{posx - 5}" cy="{posy - 5}" r="3" fill="black"/> <circle cx="{posx + 5}" cy="{posy + 5}" r="3" fill="black"/>'
        case 5:
            return f'<rect x="{posx - 8}" y="{posy - 1}" width="16" height="2" fill="black"/> <rect x="{posx - 1}" y="{posy - 8}" width="2" height="16" fill="black"/>'


for i in range(0, 48):
    if i in (36, 37, 42, 43):
        continue  # Do not touch big micropuls

    # Load the image file
    img = cv2.imread(f"../png/tile_{i}.png")

    # Get the width and height of the image
    height, width = img.shape[:2]

    # Cut the image into quarters
    top_left = img[0:height//2, 0:width//2]
    top_right = img[0:height//2, width//2:width]
    bottom_left = img[height//2:height, 0:width//2]
    bottom_right = img[height//2:height, width//2:width]

    # Rotate the quarters to match the top left one
    top_right = cv2.rotate(top_right, cv2.ROTATE_90_COUNTERCLOCKWISE)
    bottom_left = cv2.rotate(bottom_left, cv2.ROTATE_90_CLOCKWISE)
    bottom_right = cv2.rotate(bottom_right, cv2.ROTATE_180)

    svg = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">'
    svg += draw(0, 0, most_similar(top_left))
    svg += draw(1, 0, most_similar(top_right))
    svg += draw(0, 1, most_similar(bottom_left))
    svg += draw(1, 1, most_similar(bottom_right))
    svg += "</svg>"

    with open(f'../svg/tile_{i}.svg', 'w') as svg_img:
        svg_img.write(svg)
