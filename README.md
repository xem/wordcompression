WORDCOMPRESSION
==

Let's test different approaches for compressing and decompressing a dictionnary of english words (uppercase, no accent or punctuation, 1-5 letters long) in JavaScript.

The goal is not to find the smallest encoded string, but the string that will compress the best through RoadRoller.js and gzip.

Previous work:
--

- words.txt: raw data (14915 words, 80.8 kb)
- words.js: json data (109 kb)
- words.txt zipped: ~24 kb
- txt + RoadRoller.js + zip: ~14 kb
- json + MiniPrefixRemover.js + RoadRoller.js + zip: 12.4kb (12741b)

New approaches:
--

- prefix.html:
<br>Alphabetical ordering + smart prefix handling + one magic number to represent "last word + s"
<br>encoded json + RoadRoller.js + zip: 11.3kb (11585b)

- prefix_remapped.html:
<br>same as above but with a remap of the encoded alphabet to use the most used letters first
<br>encoded json + RoadRoller.js + zip: 11.2kb (11447b)

- prefix_remapped_shuffled.html:
<br>same as above but with a more zip-friendly order for the dictionnay (see shuffler.html)
<br>encoded json + RoadRoller.js + zip: 11.1kb (11335b)

- we can now remove the letters that follow a "0" (already present in the remap string) and the initial 0 (unnecessary)
<br>encoded json + RoadRoller.js + zip: 11.0kb (11312b)