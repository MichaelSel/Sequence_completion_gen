const fs = require('fs');
const csv = require('csv-parser');
const make_stimuli = require('./make_stimuli')
const make_folder = require('./make_folder')
const split_stimuli_to_blocks = require('./split_stimuli_to_blocks')
const make_block_csv = require('./make_block_csv')
const make_audio = require('./make_audio')
const all_sets = JSON.parse(fs.readFileSync('./selected-7-note-sets.json','utf-8'))
const matrix = JSON.parse(fs.readFileSync('./subject_matrix.json','utf-8'))
const EDO = require("edo.js").EDO

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

/**Set Settings here*/
async function gen_task_set (sub_id,prefix="SVG",root='./task_sets') {
        let sub = matrix.filter(row=>row.subject_id==sub_id)[0]
        const edo = new EDO(12)
        const sub_name = prefix + "0".repeat(4-String(sub_id).length) + String(sub_id)

        make_folder(root,"/" + sub_name)
        make_folder(root + "/" + sub_name,["/audio","/csv"])
    const practice = make_stimuli(sub_name,3,1,0.3) /**Set Settings here*/
        .map((stimulus,Q_num)=>{
            stimulus.Q_num = "P" + (Q_num+1)
            stimulus.probe_file = "P-" +(stimulus.Q_num)+ "-000-probe.mp3"
            stimulus.test_file = "P-" +(stimulus.Q_num)+ "-001-test.mp3"
            return stimulus
        })

    const stimuliDiatonic = make_stimuli(sub_name,30,2,0.3,[0,2,4,5,7,9,11],"diatonic") /**Set Settings here*/
    const stimuliPentatonic = make_stimuli(sub_name,30,2,0.3,[0,2,4,7,9],"pentatonic") /**Set Settings here*/
    const stimuli = shuffle([...shuffle(stimuliDiatonic),...shuffle(stimuliPentatonic)])
            .map((stimulus,Q_num)=>{
                stimulus.Q_num = Q_num+1
                stimulus.probe_file = "Q-" +(stimulus.Q_num)+ "-000-probe.mp3"
                stimulus.test_file = "Q-" +(stimulus.Q_num)+ "-001-test.mp3"
                return stimulus
            })


        const blocks = [practice,...split_stimuli_to_blocks(stimuli,10)]

        const process_block_audio = function (block) {
            const audio_dir = root+"/" + sub_name +"/audio/"
            let mp3 = []
            block.forEach((stimulus,Q_num)=>{
                let test = (stimulus['violated'])?[stimulus['violation_note']]:[stimulus['true_note']]
                let probe = stimulus['melody']

                mp3.push(make_audio(probe,audio_dir + stimulus.probe_file),make_audio(test,audio_dir + stimulus.test_file))
            })
            return Promise.all(mp3)

        }
        async function process_block  (block_num=0) {
                if(block_num<blocks.length) {
                    console.log(sub_name,"processing block " + (block_num+1))
                    let block = blocks[block_num]
                    block.forEach((stimulus,Q_num)=>{
                        stimulus.block = block_num+1
                    })
                    make_block_csv(sub_name,root+"/" + sub_name +"/",block_num+1,block)
                    await process_block_audio(block)
                    console.log("created block " + parseInt(block_num+1) +" audio")
                    await process_block(block_num+1)
                }
        }
        await process_block(0).then(function () {
            console.log("finished", sub_name)
        })
    return sub_name
}


module.exports = gen_task_set



// gen_task_set(1000)
