const EDO = require("edo.js").EDO
let edo = new EDO(12)
const mod = (n, m) => {
    return ((n % m) + m) % m;
}
const JS = function (thing) {
    return JSON.stringify(thing).replace(/"/g,'')
}

const CJS = function (thing) {
    console.log(JS(thing))
}
const rand_int_in_range = function (min,max) {
    return Math.floor(Math.random() * (max - min +1)) + min
}

const rand_int_in_range_but_not_zero = function (min,max) {
    let val = Math.floor(Math.random() * (max - min +1)) + min
    while(val==0) val = Math.floor(Math.random() * (max - min +1)) + min
    return val
}

const shuffle = function (array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

const make_fragment = function (fragment_length=rand_int_in_range(2,3),max_traverse=2,min_ginterval=-2,max_ginterval=2,repeat_last=false) {
    let interval_fragment = []
    for (let i = 0; i < fragment_length; i++) {
        interval_fragment.push(rand_int_in_range_but_not_zero(min_ginterval,max_ginterval))
    }
    if(repeat_last) interval_fragment.push(0)
    let interval_fragment_traverse = interval_fragment.reduce((ag,e)=>ag+e,0)
    if(Math.abs(interval_fragment_traverse)>max_traverse || interval_fragment_traverse==0) return make_fragment(fragment_length,max_traverse,min_ginterval,max_ginterval)
    if(interval_fragment.filter(f=>f>0).length==0 || interval_fragment.filter(f=>f<0).length==0) return make_fragment(fragment_length,max_traverse,min_ginterval,max_ginterval)

    return interval_fragment
}

const make_trial = function (fragment,scale = edo.scale(diatonic_pitches),starting_pitch=0,mode=0,repeat_fragment = 4,type='diatonic',violated=true,test_pos=1) {

    let fragment_as_pitches = scale.mode(mode).get.melody_from_intervals(fragment)
    let fragment_as_semitones = edo.convert.to_steps(fragment_as_pitches)
    let fragment_span = fragment.reduce((ag,e)=>ag+e,0)
    let unique
    let melody
    let scale_pitches
    let true_note
    let violation_note

    const get_violation_note =  (melody, true_note) => [...melody].sort((a,b)=>Math.abs(a-true_note)-Math.abs(b-true_note)).filter(n=>n!=true_note && n!=melody[melody.length-1])[0]

    let generic_repeat = Array.from(Array(repeat_fragment).fill(fragment).flat())
    let dia_melody = scale.mode(mode).get.melody_from_intervals(generic_repeat,1,starting_pitch)
    let specific_repeat = Array.from(Array(repeat_fragment).fill(fragment_as_semitones).flat())
    let ch_melody = edo.convert.intervals_to_pitches(specific_repeat,starting_pitch)

    if(edo.is.same(dia_melody,ch_melody)) {
        console.log("Make longer to prevent similarity")
        return make_trial(fragment,scale,starting_pitch,mode,repeat_fragment+1,type,violated,test_pos) //If they are the same add another repetition to distinguish them
    }
    if(type=="diatonic") melody = dia_melody
    else melody = ch_melody
    true_note = melody.slice(melody.length-test_pos,(melody.length-test_pos)+1)[0]
    melody = melody.slice(0,melody.length-test_pos)
    if(true_note>Math.max(...melody) || true_note<Math.min(...melody)) {
        return make_trial(fragment,scale,starting_pitch,mode,repeat_fragment,type,violated,test_pos+1) //If the test note was not previously in the melody, the prediction will make a contour violation, therefore, create a new one
    }
    violation_note = get_violation_note(melody,true_note)
    unique = edo.scale(melody).pitches.length
    scale_pitches = scale.pitches

    return {type: type,violated:violated,fragment_specific: fragment_as_semitones,unique:unique, scale:scale_pitches,mode_num:mode, fragment_generic: fragment, fragment_span:fragment_span,melody:melody,true_note:true_note,violation_note:violation_note,starting_pitch:starting_pitch}

}

const make_stimuli = function (subject_id,total_fragments=4,questions_per_fragment_per_condition=2,foil_rate=0.3,diatonic_pitches = [0,2,4,5,7,9,11]) {

    const repeat_fragment = 4
    const trials_per_condition = questions_per_fragment_per_condition*total_fragments
    const total_trials = trials_per_condition*2 //two conditions

    // let type_random = shuffle(Array.from(Array(total_trials)).map((e,i)=>(i>=total_trials/2)?"diatonic":"chromatic")) //half the trials diatonic and half chromatic
    let starting_pitch_random = shuffle(Array.from(Array(total_trials)).map((e,i)=>(i%7)-3)) //transposed from -3 to +3
    let starting_mode_random = shuffle(Array.from(Array(total_trials)).map((e,i)=>i%diatonic_pitches.length)) //Every mode of the diatonic
    let diatonic_violated = shuffle(Array.from(Array(trials_per_condition)).map((e,i)=>(i<trials_per_condition*foil_rate)?true:false))
    let chromatic_violated = shuffle(Array.from(Array(trials_per_condition)).map((e,i)=>(i<trials_per_condition*foil_rate)?true:false))

    const diatonic = edo.scale(diatonic_pitches)
    const chromatic = edo.scale([0,1,2,3,4,5,6,7,8,9,10,11])




    let fragments = []
    while(fragments.length<total_fragments) {
        let frag = make_fragment()
        if(edo.is.element_of(frag,fragments)) continue
        fragments.push(frag)
    }




    let stimuli = []
    fragments.forEach(frag=>{
        for (let i = 0; i < questions_per_fragment_per_condition; i++) {
            const starting_pitch_d = starting_pitch_random.pop()
            const starting_mode_d = starting_mode_random.pop()
            const violated_d = diatonic_violated.pop()
            const trial_d = make_trial(frag,diatonic,starting_pitch_d,starting_mode_d,repeat_fragment,"diatonic",violated_d)
            stimuli.push(trial_d)
            const starting_pitch_c = starting_pitch_random.pop()
            const starting_mode_c = starting_mode_random.pop()
            const violated_c = chromatic_violated.pop()
            const trial_c = make_trial(frag,diatonic,starting_pitch_c,starting_mode_c,repeat_fragment,"chromatic",violated_c)
            stimuli.push(trial_c)

        }
    })

    stimuli.forEach(s=>s.subject_id = subject_id)
    stimuli = shuffle(stimuli)
    stimuli.forEach((s,i)=>s.Q_num = i+1)
    return stimuli


}

// let stimuli = make_stimuli("test",20,2)
// stimuli.forEach(stim=>{
//     CJS(stim)
// })


module.exports = make_stimuli

