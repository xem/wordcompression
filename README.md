WORDCOMPRESSION
==

Let's test different approaches for compressing and decompressing a dictionnary of english words (uppercase, no accent or punctuation, 2-5 letters long) in JavaScript.

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
<br>Alphabetical ordering + smart prefix handling + one magic number to represent "last word + s" (replacing more than one prefix makes the zip bigger)
<br>encoded json + RoadRoller.js + zip: 11.3kb (11585b)

- prefix_remapped.html:
<br>same as above but with a remap of the encoded alphabet to use the most used letters first
<br>encoded json + RoadRoller.js + zip: 11.2kb (11447b)

- prefix_remapped_shuffled.html:
<br>same as above but with a more zip-friendly order for the dictionnay (see shuffler.html)
<br>encoded json + RoadRoller.js + zip: 11.1kb (11335b)

- <s>omit.html</s> (discontinued)
<br>omit the letters that follow a "0" (already present in the remap string) and the initial 0 (unnecessary)
<br>encoded json + RoadRoller.js + zip: 11.0kb (11299b)

- <s>omit2.html</s> (discontinued)
<br>omit the letters that follow a "1" (when predictable, i.e. next letter in the alphabet). replace 1 with 8 when unpredictable.
<br>encoded json + RoadRoller.js + zip: 11.0kb (11266b)

- shuffle2.html
<br>starts from prefix_remapped_shuffled.html, and finds the remap and the shuffle (not only level-0 shuffle, but at every N) that optimize both RoadRoller and Gzip. (11,201b)

---

With 3-5 letter words only (3-5.js):

- prefix: 11843b
- prefix + A=s: 11367b
- prefix-remapped + 9=s: 11238b
- prefix-remapped-shuffled + 9=s: 11203b
- omit: 11163b
- omit2: 11094b
- prefix + 9=s + remap + 5D shuffle: 11149b
