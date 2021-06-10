const fs = require('fs');
const csv = require('csv-parser');

const make_block_csv = function (participant_id, participant_dir, block_num, stimuli) {
    const createCsvWriter = require('csv-writer').createObjectCsvWriter;





    let data =stimuli.map((stim,i) => {
        let dat = {
            subject_id: stim.subject_id,
            Q_in_block: i+1,
            block_num: block_num,
            probe_file:stim.probe_file,
            test_file:stim.test_file,
            type:stim.type,
            violated:stim.violated,
            fragment_specific:stim.fragment_specific,
            unique:stim.unique,
            scale:stim.scale,
            mode_num:stim.mode_num,
            fragment_generic:stim.fragment_generic,
            fragment_span:stim.fragment_span,
            melody:stim.melody,
            true_note:stim.true_note,
            violation_note:stim.violation_note,
            starting_pitch:stim.starting_pitch,




        }
        return dat
    })
    fs.writeFile(participant_dir + "csv/" + "block_" + block_num + ".json", JSON.stringify(data), function(err) {
        if(err) {
            return console.log(err);
        }
    });
    const csvWriter = createCsvWriter({
        path: participant_dir + "csv/" + "block_" + block_num + ".csv",
        header: Object.keys(data[0]).map(el=>{return {id:el,title:el}})
    }).writeRecords(data)
        .then(()=> console.log("CSV file subject",participant_id,"block", block_num,"was successfully created."));
}

module.exports = make_block_csv