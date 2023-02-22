import express from 'express';
import axios from 'axios';
import fs from 'fs';
import fsExtra from 'fs-extra';
import request from 'request';
import randomstring from 'randomstring';
import archiver from 'archiver';
import helmet from 'helmet';
import cors from 'cors';

const PORT = 4000;

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST'],
};

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

app.get('/download', async (req, res) => {
  try {
    const { url } = req.query;
    const result = await axios.get(`http://127.0.0.1:5000/findUrls?url=${url}`);
    const urls = await result.data;
    console.log(1);
    let imageNames = [];
    let folderName = randomstring.generate();
    console.log(2);

    await fs.mkdir(folderName, (err) => {
      if (err) {
        console.log(err);
        res.status(500).send('Failed to create folder');
      }
    });
    console.log(3);

    for (const url of urls) {
      const result = await axios.post(`http://localhost:4000/downloadImage`, {
        url,
        folderName,
      });
      const data = await result.data;

      await imageNames.push(data.name);
    }
    console.log(4);

    const zipFileName = 'Images.zip';

    const archive = await archiver('zip', {
      zlib: { level: 9 },
    });
    console.log(5);

    for (const x of imageNames) {
      await archive.file(`${folderName}/${x}`, { name: `${x}` });
    }
    console.log(6);

    await archive.finalize();
    console.log(7);

    res.attachment(zipFileName);
    console.log(8);

    await fsExtra.remove(folderName, (err) => {
      if (err) {
        console.log(err);
        res.status(500).send('Failed to delete folder');
      } else {
        console.log(9);
        archive.pipe(res);
      }
    });

    console.log(10);
  } catch (err) {
    console.log(err);
    res.status(500).send('An error occurred');
  }
});

app.post('/downloadImage', async (req, res) => {
  try {
    const { url, folderName } = req.body;
    let name = randomstring.generate();

    request(url)
      .on('error', (err) => {
        console.log(err);
        res.status(500).send('Error downloading image');
      })
      .pipe(fs.createWriteStream(`./${folderName}/${name}.jpg`))
      .on('close', () => {
        console.log('Image downloaded successfully');
        res.json({ name: `${name}.jpg` });
      });
  } catch (err) {
    console.log(err);
    res.status(500).send('An error occurred');
  }
});

app.listen(PORT, () => console.log(`Server running at port ${PORT}`));
