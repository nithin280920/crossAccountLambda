const AWS = require("aws-sdk");

AWS.config.update({ region: "ap-south-1" });

const tableName = "user";

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const sts = new AWS.STS();

    const roleToAssumeArn = "arn:aws:iam::266010696940:role/DynamoDBAccessRole";

    const assumedRole = await sts.assumeRole({
        RoleArn: roleToAssumeArn,
        RoleSessionName: "CrossAccountSession",
      }).promise();

    const dynamoDB = new AWS.DynamoDB.DocumentClient({
      accessKeyId: assumedRole.Credentials.AccessKeyId,
      secretAccessKey: assumedRole.Credentials.SecretAccessKey,
      sessionToken: assumedRole.Credentials.SessionToken,
    });

    if (body.operation === "add") {
      await addData(body.data, dynamoDB);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Data added successfully" }),
      };
    } else if (body.operation === "get") {
      const data = await getData(body.id, dynamoDB);
      return {
        statusCode: 200,
        body: JSON.stringify({ data }),
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid operation" }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

const addData = async (data, dynamoDB) => {
  const params = {
    TableName: tableName,
    Item: data,
  };
  await dynamoDB.put(params).promise();
};

const getData = async (id, dynamoDB) => {
  const params = {
    TableName: tableName,
    Key: {
      id: id,
    },
  };
  const result = await dynamoDB.get(params).promise();
  return result.Item;
};
