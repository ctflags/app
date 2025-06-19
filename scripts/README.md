These scripts are utilities to generate the list of participants and to print cards to distribute at the beginning of the event.

## Generation of the list of participants

node generate-participants.js 40 > participants.yaml

## Generation of the htlm page with particicpants cards

node generate-pdf-tokens.js participants.yaml https://cft.domain.tld