export interface Poem {
  id: number
  title: string
  content: string
}

export const bookData: Poem[] = [
  {
    id: 0,
    title: "Cover",
    content: "cover"
  },
  {
    id: 1,
    title: "Whispers",
    content: `In the quiet hours between dawn and dark,
I gather words I cannot speak,
They flutter like moths against glass,
Fragile wings seeking light.

These unsaid things accumulate,
Like dust in corners of the heart,
Until the weight of silence
Becomes heavier than speech.

Yet in this space between us,
Where words fail and gestures fall short,
Something else remains—
A knowing that needs no voice.`
  },
  {
    id: 2,
    title: "Paper Thin",
    content: `We build walls of paper thin,
Thinking they will keep us safe,
But wind and time and memory
Find every crack, every seam.

The things we hide so carefully,
The truths we tuck away,
They have a way of returning,
Like letters never sent.

Perhaps the strongest walls
Are not the ones we build,
But the ones we choose to dismantle,
Stone by stone, by choice.`
  },
  {
    id: 3,
    title: "The Space Between",
    content: `There is a space between hello and goodbye,
Between what was and what will be,
Where possibility hangs suspended,
Like breath held too long.

In this moment, this pause,
Everything exists at once—
The love that was, the love that could be,
The love that never quite found form.

We stand on this precipice,
Looking backward and forward,
While the present slips through our fingers,
Like water, like time, like us.`
  },
  {
    id: 4,
    title: "Echoes",
    content: `I hear your voice in empty rooms,
See your shadow in doorway light,
Feel your absence like a temperature change,
A sudden cold, a sudden clarity.

The echoes of what we were
Reverberate through ordinary days—
A song we danced to, a joke we shared,
A silence that meant everything.

Time is supposed to heal, they say,
But sometimes it just deepens the grooves,
Makes the patterns more permanent,
Until the past becomes the present.`
  },
  {
    id: 5,
    title: "Unwritten Letters",
    content: `I have a drawer full of unwritten letters,
Each one a conversation we never had,
Each one a truth I couldn't speak,
Each one a version of us that never existed.

They pile up over years,
Like snow that never melts,
Like leaves that never fall,
Like words that never find their way to air.

Perhaps some things are meant
To remain unwritten, unsaid,
To exist only in the space between thought and expression,
Where they can be perfect, untouched, unreal.`
  }
]
