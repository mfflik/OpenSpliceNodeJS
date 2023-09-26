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

'use strict';

// Import necessary modules
const dds = require('vortexdds');
const path = require('path');

// Declare a variable to store the topic data
let topicData = null;

// Create a DDS participant with a domain ID of 4
const participant = new dds.Participant(4);

// Asynchronous function to initialize the DDS subscriber
async function initial() {
  try {
    // Define the topic name, IDL file name, and its path
    const topicName = "Hello";
    const idlName = "HelloWorldData.idl";
    const idlPath = __dirname + path.sep + idlName;

    // Import the IDL and get the type support for the data type
    const typeSupports = await dds.importIDL(idlPath);
    const typeSupport = typeSupports.get("HelloWorldData::Msg");

    // Define the QoS settings for the topic
    const tqos = dds.QoS.topicDefault();
    tqos.durability = { kind: dds.DurabilityKind.Transient };
    tqos.reliability = { kind: dds.ReliabilityKind.BestEffort };

    // Create a topic with the specified configuration
    topicData = participant.createTopic(topicName, typeSupport, tqos);

    // Subscribe to the data and log the end of the subscription
    subscribeData().then(() => {
      console.log('=== HelloWorldSubscriber end');
    }).catch((error) => {
      console.log('Error: ' + error.message);
      process.exit(1);
    });

  } catch (error) {
    // Handle exceptions
    await participant.findTopic('Hello')
      .then(topic => {
        topicData = topic;
      })
      .catch(err => {
        console.log(err);
        // Process any exception
      })
      .then(_ => {
        // Subscribe to the data and log the end of the subscription
        subscribeData().then(() => {
          console.log('=== HelloWorldSubscriber end');
        }).catch((error) => {
          console.log('Error: ' + error.message);
          process.exit(1);
        });
      });
  }
}

// Asynchronous function to subscribe to data
async function subscribeData() {
  console.log('=== HelloWorldSubscriber start');
  try {
    // Configure the subscriber QoS settings
    const sqos = dds.QoS.subscriberDefault();
    sqos.partition = { names: 'Hello' };

    // Create a subscriber
    const sub = participant.createSubscriber(sqos);

    // Configure the reader QoS settings
    const rqos = dds.QoS.readerDefault();
    rqos.durability = { kind: dds.DurabilityKind.Transient };
    rqos.reliability = { kind: dds.ReliabilityKind.BestEffort };

    // Create a reader for the topic
    const reader = sub.createReader(topicData, rqos);

    console.log('=== [Subscriber] Ready ...');

    // Start taking data from the reader
    await takeData(reader);

  } finally {
    console.log('=== Cleanup resources');
    if (participant !== null) {
      // Delete the participant and handle any errors
      participant.delete().catch((error) => {
        console.log('Error cleaning up resources: ' + error.message);
      });
    }
  }
}

// Asynchronous function to continuously take data from the reader
async function takeData(reader) {
  let shouldContinue = true;

  while (shouldContinue) {
    try {
      if (reader?.take) {
        // Attempt to take one sample from the reader
        const takeArray = reader.take(1);

        if (takeArray?.[0]?.info?.valid_data) {
          // Log received message data
          console.log('=== [Subscriber] message received :');
          console.log('    userID  : ' + takeArray[0].sample.userID);
          console.log('    Message : ' + takeArray[0].sample.message);
        }

      } else {
        console.log('=== [Subscriber] reader.take tidak tersedia.'); // Note: This message is in Indonesian
      }
    } catch (error) {
      console.log(error);
      shouldContinue = false;
      // Reinitialize the subscriber in case of an error
      initial();
    }
    await sleep(100); // Delay before taking the next sample
  }
}

// Function to introduce a delay (sleep) in milliseconds
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Initialize the DDS subscriber when the script is run
initial();
