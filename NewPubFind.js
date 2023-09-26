/*
 *                         Vortex OpenSplice
 *
 *   This software and documentation are Copyright 2006 to 2021 ADLINK
 *   Technology Limited, its affiliated companies and licensors. All rights
 *   reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 */

const dds = require("vortexdds");
const path = require("path");

let topicData = null;

const participant = new dds.Participant(4);
async function initial() {
  try {
    // Create a participant
    const participant = new dds.Participant();

    // Define your topic and data type based on your provided configuration
    const topicName = "Hello";
    const idlName = "HelloWorldData.idl";
    const idlPath = __dirname + path.sep + idlName;

    const typeSupports = await dds.importIDL(idlPath);
    const typeSupport = typeSupports.get("HelloWorldData::Msg");

    // Define the topic QoS settings
    const tqos = dds.QoS.topicDefault();
    tqos.durability = { kind: dds.DurabilityKind.Transient };
    tqos.reliability = { kind: dds.ReliabilityKind.BestEffort };

    // Create a topic with the specified configuration
    topicData = participant.createTopic(topicName, typeSupport, tqos);

    publishData();
  } catch (error) {
    console.error("Error:", error);
    await participant
      .findTopic("Hello")
      .then((topic) => {
        topicData = topic;
      })
      .catch((err) => {
        console.log(err);
        // process any exception
      })
      .then((_) => {
        publishData();
        console.log("success");
      });
  }
  // Create a participant
}
async function publishData() {
  try {
    // Define the publisher QoS settings
    const pqos = dds.QoS.publisherDefault();
    pqos.partition = { names: "Hello" };

    // Create a publisher with the specified configuration
    const pub = participant.createPublisher(pqos);

    // Define the writer QoS settings
    const wqos = dds.QoS.writerDefault();
    wqos.durability = { kind: dds.DurabilityKind.Transient };
    wqos.reliability = { kind: dds.ReliabilityKind.BestEffort };

    // Create a writer for the topic with the specified configuration
    const writer = pub.createWriter(topicData, wqos);

    let userID = 1;

    // Function to send data every 1 second
    setInterval(() => {
      const msg = { userID, message: `Data From Node.js` };

      console.log("=== [Publisher] writing a message containing :");
      console.log("    userID  : " + msg.userID);
      console.log("    Message : " + msg.message);

      writer.writeReliable(msg);

      userID++;
    }, 1000); // Send data every 1 second
  } catch (error) {
    console.error("Error:", error);
  }
}

initial();
