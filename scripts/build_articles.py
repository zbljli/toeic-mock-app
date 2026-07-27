#!/usr/bin/env python3
"""Generate articles.json with full scene vocabulary coverage."""
import json
from pathlib import Path

SRC = Path('/Users/lujiali/toeic-mock-app/src/data')

with open(SRC / 'scenes.json') as f: scenes = json.load(f)
with open(SRC / 'words.json') as f: words = json.load(f)

word_map = {w['id']: w for w in words}

def art(id_, scene_id, title, type_, time_, passage, word_ids, questions, audio="", dur=0):
    return {"id":id_,"sceneId":scene_id,"title":title,"type":type_,"estimatedTime":time_,"passage":passage,"vocabWordIds":word_ids,"audio_url":audio,"duration":dur,"questions":questions}

def q(id_, text, opts, correct):
    return {"id":id_,"text":text,"options":opts,"correctIndex":correct}

articles = []
